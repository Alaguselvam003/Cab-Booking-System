import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PassengerService } from '../../../core/services/passenger.service';
import { LocationService } from '../../../core/services/location.service';
import { FareService } from '../../../core/services/fare.service';
import { forkJoin, switchMap, map, finalize, of } from 'rxjs';

declare var L: any;

interface GridCell {
  row: number;
  col: number;
}

@Component({
  selector: 'app-passenger-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  providers: [DecimalPipe]
})
export class PassengerDashboardComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  rideHistory: any[] = [];
  

  activeTab = 'overview';
  

  totalRides = 0;
  completedRides = 0;
  cancelledRides = 0;
  totalSpent = 0;


  pickupAddress = '';
  dropAddress = '';
  travelDate = '';
  bookingLoading = false;
  bookingError = '';
  bookingSuccess = '';
  distanceKm: number | null = null;
  calculatedFare: number | null = null;
  private pickupCoords: { lat: number; lng: number } | null = null;
  private dropCoords: { lat: number; lng: number } | null = null;


  private bookingMap: any = null;
  private bookingPickupMarker: any = null;
  private bookingDropMarker: any = null;
  private bookingRoutePolyline: any = null;

  activeRide: any = null;
  private activeRideMap: any = null;
  private activeRidePickupMarker: any = null;
  private activeRideDropMarker: any = null;
  private activeRideDriverMarker: any = null;
  private activeRideRoutePolyline: any = null;

  selectedRide: any = null;
  private detailsMap: any = null;
  private detailsPickupMarker: any = null;
  private detailsDropMarker: any = null;
  private detailsRoutePolyline: any = null;


  profileName = '';
  profileEmail = '';
  profilePhone = '';
  profilePassword = '';
  profileLoading = false;
  profileSuccess = '';
  profileError = '';


  notifications: string[] = [];
  private lastRideStatus: string | null = null;


  pickup: GridCell | null = null;
  drop: GridCell | null = null;
  selectionMode: 'pickup' | 'drop' = 'pickup';
  gridSize = 8;
  gridRows = Array.from({ length: this.gridSize }, (_, i) => i + 1);
  gridCols = Array.from({ length: this.gridSize }, (_, i) => i + 1);
  driverLocation: { latitude: number; longitude: number } | null = null;
  driverPath: any[] = [];


  ratingData = {
    rating: 5,
    feedback: ''
  };
  showRatingForm = false;
  ratedRideId: number | null = null;

  message = '';
  private pollingInterval: any = null;

  constructor(
    private passengerService: PassengerService, 
    private locationService: LocationService,
    private fareService: FareService,
    private router: Router,
    private decimalPipe: DecimalPipe,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUser = JSON.parse(userJson);
    

    this.profileName = this.currentUser.name;
    this.profileEmail = this.currentUser.email;
    this.profilePhone = this.currentUser.phone ? this.currentUser.phone.toString() : '';

    this.loadHistory();
    this.checkSavedActiveRide();


    const pendingJson = localStorage.getItem('pendingBooking');
    if (pendingJson) {
      try {
        const pending = JSON.parse(pendingJson);
        if (pending.pickupAddress) {

          this.pickupAddress = pending.pickupAddress;
          this.dropAddress = pending.dropAddress;
          this.travelDate = pending.date;
          this.pickupCoords = pending.pickupCoords;
          this.dropCoords = pending.dropCoords;
          this.distanceKm = pending.distanceKm;
          this.calculatedFare = pending.calculatedFare;
          
          this.activeTab = 'book';
          localStorage.removeItem('pendingBooking');
          
          setTimeout(() => {
            this.initBookingMap();
            if (this.pickupCoords && this.dropCoords) {
              this.locationService.getRoute(
                this.pickupCoords.lat, this.pickupCoords.lng,
                this.dropCoords.lat, this.dropCoords.lng
              ).subscribe({
                next: (route) => {
                  this.updateBookingMap(route.coordinates);
                }
              });
            }
          }, 300);
        } else {

          this.pickup = pending.pickup;
          this.drop = pending.drop;
          this.travelDate = pending.date;
          localStorage.removeItem('pendingBooking');
          
          if (this.pickup && this.drop) {
            this.pickupAddress = `Row ${this.pickup.row}, Col ${this.pickup.col}`;
            this.dropAddress = `Row ${this.drop.row}, Col ${this.drop.col}`;
            this.pickupCoords = { lat: this.pickup.row, lng: this.pickup.col };
            this.dropCoords = { lat: this.drop.row, lng: this.drop.col };
          }
          
          this.activeTab = 'book';
          this.calculateFare();
        }
      } catch (e) {
        console.error('Error loading pending booking:', e);
      }
    }
  }

  ngOnDestroy() {
    this.stopPolling();
    this.destroyMaps();
  }

  logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('activeRideId');
    this.stopPolling();
    this.router.navigate(['/login']);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.message = '';
    this.bookingError = '';
    this.bookingSuccess = '';
    this.profileError = '';
    this.profileSuccess = '';
    this.showRatingForm = false;

    if (tab === 'book') {
      setTimeout(() => {
        this.initBookingMap();
        if (this.pickupCoords && this.dropCoords) {
          this.locationService.getRoute(
            this.pickupCoords.lat, this.pickupCoords.lng,
            this.dropCoords.lat, this.dropCoords.lng
          ).subscribe({
            next: (route) => {
              this.updateBookingMap(route.coordinates);
            }
          });
        }
      }, 200);
    } else if (tab === 'active') {
      setTimeout(() => {
        this.initActiveRideMap();
        this.triggerActiveRideMapUpdate();
      }, 200);
    }

    this.cdr.detectChanges();
  }

  loadHistory() {
    if (!this.currentUser) return;
    this.passengerService.getRideHistory(this.currentUser.userId).subscribe({
      next: (data) => {
        this.rideHistory = data.sort((a: any, b: any) => {
          return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
        });
        this.calculateStats();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching ride history:', err)
    });
  }

  calculateStats() {
    this.totalRides = this.rideHistory.length;
    this.completedRides = this.rideHistory.filter(r => r.status === 'COMPLETED').length;
    this.cancelledRides = this.rideHistory.filter(r => r.status === 'CANCELLED').length;
    this.totalSpent = this.rideHistory
      .filter(r => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + (r.fare || 0), 0);
  }

  checkSavedActiveRide() {
    const activeRideId = localStorage.getItem('activeRideId');
    if (activeRideId) {
      this.startTrackingRide(Number(activeRideId));
    }
  }


  onBookFormChange() {
    this.bookingError = '';
    this.bookingSuccess = '';
    this.distanceKm = null;
    this.calculatedFare = null;
  }

  calculateFare() {
    if (!this.pickupAddress.trim() || !this.dropAddress.trim()) {
      this.bookingError = 'Please fill both pickup and drop-off points.';
      return;
    }

    this.bookingLoading = true;
    this.bookingError = '';

    forkJoin({
      origin: this.locationService.geocode(this.pickupAddress),
      destination: this.locationService.geocode(this.dropAddress)
    }).pipe(
      switchMap((coords) => {
        this.pickupCoords = { lat: coords.origin.lat, lng: coords.origin.lng };
        this.dropCoords = { lat: coords.destination.lat, lng: coords.destination.lng };
        
        return this.locationService.getRoute(
          this.pickupCoords.lat, this.pickupCoords.lng,
          this.dropCoords.lat, this.dropCoords.lng
        );
      }),
      switchMap((route) => {
        this.distanceKm = route.distanceKm;
        
        return this.fareService.calculateFare(route.distanceKm).pipe(
          map((fareRes) => ({
            fareRes,
            route
          }))
        );
      }),
      finalize(() => {
        this.bookingLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: ({ fareRes, route }) => {
        this.calculatedFare = fareRes.fare;
        this.initBookingMap();
        this.updateBookingMap(route.coordinates);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Booking estimate error:', err);
        if (err.message && err.message.includes('Location not found')) {
          this.bookingError = 'One or both of the locations could not be resolved. Please try Chennai landmarks.';
        } else if (err.message && err.message.includes('No driving route')) {
          this.bookingError = 'Could not calculate road distance between these points.';
        } else {
          this.bookingError = 'Failed to calculate estimate. Please try again.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  requestRide() {
    if (!this.pickupCoords || !this.dropCoords || !this.currentUser || !this.calculatedFare) {
      this.bookingError = 'Please calculate a fare estimate first.';
      return;
    }

    this.bookingLoading = true;

    const ridePayload = {
      passenger: { userId: this.currentUser.userId },
      pickupLat: this.pickupCoords.lat,
      pickupLng: this.pickupCoords.lng,
      dropLat: this.dropCoords.lat,
      dropLng: this.dropCoords.lng,
      fare: this.calculatedFare
    };

    this.passengerService.requestRide(ridePayload).pipe(
      finalize(() => {
        this.bookingLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.activeRide = response;
        localStorage.setItem('activeRideId', response.id.toString());
        this.bookingSuccess = 'Ride requested successfully!';
        this.addNotification('Ride requested successfully! Waiting for driver acceptance...');
        

        this.pickupAddress = '';
        this.dropAddress = '';
        this.travelDate = '';
        this.distanceKm = null;
        this.calculatedFare = null;
        

        this.setActiveTab('active');
        this.startTrackingRide(response.id);
      },
      error: (err) => {
        console.error('Error requesting ride:', err);
        this.bookingError = 'Failed to request ride. Please check network connections.';
      }
    });
  }

  startTrackingRide(rideId: number) {
    this.stopPolling();
    this.pollRideStatus(rideId);
    this.pollingInterval = setInterval(() => {
      this.pollRideStatus(rideId);
    }, 3000);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  pollRideStatus(rideId: number) {
    this.passengerService.getDriverLocation(rideId).subscribe({
      next: (data) => {
        this.driverLocation = data.latitude ? { latitude: data.latitude, longitude: data.longitude } : null;
        this.driverPath = data.path || [];

        this.passengerService.getRideHistory(this.currentUser.userId).subscribe({
          next: (rides) => {
            const current = rides.find((r: any) => r.id === rideId);
            if (current) {
              this.activeRide = current;
              

              this.pickupCoords = { lat: current.pickupLat, lng: current.pickupLng };
              this.dropCoords = { lat: current.dropLat, lng: current.dropLng };

              this.triggerActiveRideMapUpdate();
              this.handleStatusNotifications(current);

              if (current.status === 'COMPLETED') {
                this.stopPolling();
                this.message = 'Ride completed successfully!';
                this.addNotification('Your ride has completed. Thank you for riding with us!');
                this.ratedRideId = rideId;
                this.showRatingForm = true;
                localStorage.removeItem('activeRideId');
                this.loadHistory();
              } else if (current.status === 'CANCELLED') {
                this.stopPolling();
                this.message = 'Ride was cancelled.';
                this.addNotification('Your ride was cancelled.');
                this.activeRide = null;
                localStorage.removeItem('activeRideId');
                this.loadHistory();
              }
              this.cdr.detectChanges();
            }
          }
        });
      },
      error: (err) => console.error('Error tracking driver:', err)
    });
  }

  cancelRide() {
    if (!this.activeRide) return;
    
    const confirmCancel = confirm('Are you sure you want to cancel this ride?');
    if (!confirmCancel) return;

    this.passengerService.cancelRide(this.activeRide.id).subscribe({
      next: () => {
        this.message = 'Ride cancelled successfully.';
        this.addNotification('You cancelled your ride.');
        this.stopPolling();
        this.activeRide = null;
        localStorage.removeItem('activeRideId');
        this.loadHistory();
        this.setActiveTab('overview');
      },
      error: (err) => console.error('Error cancelling ride:', err)
    });
  }

  handleStatusNotifications(ride: any) {
    if (ride.status === this.lastRideStatus) return;

    if (ride.status === 'REQUESTED') {
      this.addNotification('Your request has been placed. Waiting for a driver.');
    } else if (ride.status === 'ACCEPTED') {
      this.addNotification(`Driver ${ride.driver.user.name} accepted your ride!`);
    } else if (ride.status === 'IN_RIDE') {
      this.addNotification('Your ride has started. Have a safe journey!');
    }
    this.lastRideStatus = ride.status;
  }

  addNotification(notif: string) {
    this.notifications.unshift(`[${new Date().toLocaleTimeString()}] ${notif}`);
    if (this.notifications.length > 8) {
      this.notifications.pop();
    }
  }

  clearNotifications() {
    this.notifications = [];
  }


  submitRating() {
    if (!this.ratedRideId) return;
    const ratingPayload = {
      rating: this.ratingData.rating,
      feedback: this.ratingData.feedback
    };
    this.passengerService.rateRide(this.ratedRideId, ratingPayload).subscribe({
      next: () => {
        this.message = 'Thank you for your feedback!';
        this.showRatingForm = false;
        this.ratedRideId = null;
        this.ratingData = { rating: 5, feedback: '' };
        this.loadHistory();
        this.setActiveTab('history');
      },
      error: (err) => console.error('Error rating ride:', err)
    });
  }


  viewRideDetails(ride: any) {
    this.selectedRide = ride;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.initDetailsMap();
      if (ride.pickupLat && ride.dropLat) {
        this.locationService.getRoute(
          ride.pickupLat, ride.pickupLng,
          ride.dropLat, ride.dropLng
        ).subscribe({
          next: (route) => {
            this.updateDetailsMap(route.coordinates, [ride.pickupLat, ride.pickupLng], [ride.dropLat, ride.dropLng]);
          }
        });
      }
    }, 200);
  }

  closeDetailsModal() {
    this.selectedRide = null;
    if (this.detailsMap) {
      this.detailsMap.remove();
      this.detailsMap = null;
    }
    this.cdr.detectChanges();
  }


  saveProfile() {
    if (!this.currentUser) return;
    if (!this.profileName.trim() || !this.profileEmail.trim() || !this.profilePhone.trim()) {
      this.profileError = 'All profile fields except password are required.';
      return;
    }

    this.profileLoading = true;
    this.profileError = '';
    this.profileSuccess = '';

    const profilePayload = {
      name: this.profileName,
      email: this.profileEmail,
      phone: Number(this.profilePhone),
      password: this.profilePassword ? this.profilePassword : null
    };

    this.passengerService.updateProfile(this.currentUser.userId, profilePayload).pipe(
      finalize(() => {
        this.profileLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (updatedUser) => {
        this.currentUser = updatedUser;
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.profileSuccess = 'Profile details updated successfully!';
        this.profilePassword = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Profile update error:', err);
        this.profileError = 'Failed to update profile details. Make sure the email is unique.';
        this.cdr.detectChanges();
      }
    });
  }


  private initBookingMap() {
    if (this.bookingMap) return;
    const mapEl = document.getElementById('bookingMap');
    if (!mapEl) return;

    this.bookingMap = L.map('bookingMap', {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([13.0827, 80.2707], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.bookingMap);
  }

  private updateBookingMap(coordinates: [number, number][]) {
    if (!this.bookingMap || !this.pickupCoords || !this.dropCoords) return;

    if (this.bookingPickupMarker) this.bookingMap.removeLayer(this.bookingPickupMarker);
    if (this.bookingDropMarker) this.bookingMap.removeLayer(this.bookingDropMarker);
    if (this.bookingRoutePolyline) this.bookingMap.removeLayer(this.bookingRoutePolyline);

    this.bookingPickupMarker = L.marker([this.pickupCoords.lat, this.pickupCoords.lng], {
      icon: L.divIcon({
        className: 'custom-pickup-marker',
        html: '<i class="bi bi-geo-alt-fill text-success fs-3"></i>',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })
    }).addTo(this.bookingMap).bindPopup('Pickup Location');

    this.bookingDropMarker = L.marker([this.dropCoords.lat, this.dropCoords.lng], {
      icon: L.divIcon({
        className: 'custom-drop-marker',
        html: '<i class="bi bi-flag-fill text-danger fs-3"></i>',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })
    }).addTo(this.bookingMap).bindPopup('Drop Location');

    this.bookingRoutePolyline = L.polyline(coordinates, {
      color: '#0d6efd',
      weight: 5,
      opacity: 0.8,
      lineJoin: 'round'
    }).addTo(this.bookingMap);

    this.bookingMap.fitBounds(this.bookingRoutePolyline.getBounds(), {
      padding: [30, 30]
    });
  }

  private initActiveRideMap() {
    if (this.activeRideMap) return;
    const mapEl = document.getElementById('activeRideMap');
    if (!mapEl) return;

    this.activeRideMap = L.map('activeRideMap', {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([13.0827, 80.2707], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.activeRideMap);
  }

  private triggerActiveRideMapUpdate() {
    if (!this.activeRideMap || !this.pickupCoords || !this.dropCoords) return;


    if (!this.activeRideRoutePolyline) {
      this.locationService.getRoute(
        this.pickupCoords.lat, this.pickupCoords.lng,
        this.dropCoords.lat, this.dropCoords.lng
      ).subscribe({
        next: (route) => {
          if (this.activeRideMap) {
            this.activeRideRoutePolyline = L.polyline(route.coordinates, {
              color: '#0d6efd',
              weight: 5,
              opacity: 0.8,
              lineJoin: 'round'
            }).addTo(this.activeRideMap);
            
            this.activeRideMap.fitBounds(this.activeRideRoutePolyline.getBounds(), {
              padding: [40, 40]
            });
          }
        }
      });
    }


    if (!this.activeRidePickupMarker) {
      this.activeRidePickupMarker = L.marker([this.pickupCoords.lat, this.pickupCoords.lng], {
        icon: L.divIcon({
          className: 'custom-pickup-marker',
          html: '<i class="bi bi-geo-alt-fill text-success fs-3"></i>',
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        })
      }).addTo(this.activeRideMap).bindPopup('Pickup Location');
    }

    if (!this.activeRideDropMarker) {
      this.activeRideDropMarker = L.marker([this.dropCoords.lat, this.dropCoords.lng], {
        icon: L.divIcon({
          className: 'custom-drop-marker',
          html: '<i class="bi bi-flag-fill text-danger fs-3"></i>',
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        })
      }).addTo(this.activeRideMap).bindPopup('Drop Location');
    }


    if (this.driverLocation && this.driverLocation.latitude && this.driverLocation.longitude) {
      if (this.activeRideDriverMarker) {
        this.activeRideDriverMarker.setLatLng([this.driverLocation.latitude, this.driverLocation.longitude]);
      } else {
        this.activeRideDriverMarker = L.marker([this.driverLocation.latitude, this.driverLocation.longitude], {
          icon: L.divIcon({
            className: 'custom-driver-marker',
            html: '<i class="bi bi-car-front-fill text-warning fs-3 shadow"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(this.activeRideMap).bindPopup('Driver Location').openPopup();
      }
    } else {
      if (this.activeRideDriverMarker) {
        this.activeRideMap.removeLayer(this.activeRideDriverMarker);
        this.activeRideDriverMarker = null;
      }
    }
  }

  private initDetailsMap() {
    if (this.detailsMap) {
      this.detailsMap.remove();
      this.detailsMap = null;
    }
    const mapEl = document.getElementById('detailsMap');
    if (!mapEl) return;

    this.detailsMap = L.map('detailsMap', {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([13.0827, 80.2707], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.detailsMap);
  }

  private updateDetailsMap(coordinates: [number, number][], pickup: [number, number], drop: [number, number]) {
    if (!this.detailsMap) return;

    this.detailsPickupMarker = L.marker(pickup, {
      icon: L.divIcon({
        className: 'custom-pickup-marker',
        html: '<i class="bi bi-geo-alt-fill text-success fs-3"></i>',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })
    }).addTo(this.detailsMap);

    this.detailsDropMarker = L.marker(drop, {
      icon: L.divIcon({
        className: 'custom-drop-marker',
        html: '<i class="bi bi-flag-fill text-danger fs-3"></i>',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })
    }).addTo(this.detailsMap);

    this.detailsRoutePolyline = L.polyline(coordinates, {
      color: '#6c757d',
      weight: 5,
      opacity: 0.8,
      lineJoin: 'round'
    }).addTo(this.detailsMap);

    this.detailsMap.fitBounds(this.detailsRoutePolyline.getBounds(), {
      padding: [30, 30]
    });
  }

  private destroyMaps() {
    if (this.bookingMap) {
      this.bookingMap.remove();
      this.bookingMap = null;
    }
    if (this.activeRideMap) {
      this.activeRideMap.remove();
      this.activeRideMap = null;
    }
    if (this.detailsMap) {
      this.detailsMap.remove();
      this.detailsMap = null;
    }
  }


  getLandmarkName(lat: number, lng: number): string {
    const locations = [
      { lat: 13.0827, lng: 80.2707, name: 'Chennai Central Railway Station' },
      { lat: 13.0418, lng: 80.2341, name: 'T. Nagar, Chennai' },
      { lat: 13.0012, lng: 80.2565, name: 'Adyar, Chennai' },
      { lat: 13.0067, lng: 80.2206, name: 'Guindy, Chennai' },
      { lat: 12.9941, lng: 80.1709, name: 'Chennai International Airport' },
      { lat: 13.0475, lng: 80.2824, name: 'Marina Beach, Chennai' },
      { lat: 13.0330, lng: 80.2690, name: 'Mylapore, Chennai' },
      { lat: 12.9796, lng: 80.2196, name: 'Velachery, Chennai' }
    ];

    const tolerance = 0.005;
    const match = locations.find(loc => 
      Math.abs(loc.lat - lat) < tolerance && Math.abs(loc.lng - lng) < tolerance
    );
    if (match) return match.name;
    

    if (lat >= 1 && lat <= 8 && lng >= 1 && lng <= 8) {
      return `Grid Coordinate (${lat}, ${lng})`;
    }

    return `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }
}