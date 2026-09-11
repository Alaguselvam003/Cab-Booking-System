import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PassengerService } from '../../../core/services/passenger.service';
import { LocationService } from '../../../core/services/location.service';
import { FareService } from '../../../core/services/fare.service';
import { forkJoin, switchMap, map, finalize } from 'rxjs';

declare var L: any;



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
        this.rideHistory = (data || []).sort((a: any, b: any) => {
          return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
        });
        this.calculateStats();
        
        const active = this.rideHistory.find((r: any) => 
          r.status === 'REQUESTED' || r.status === 'ACCEPTED' || r.status === 'ONGOING' || r.status === 'IN_RIDE'
        );
        if (active) {
          const activeId = active.id || active.Id;
          this.activeRide = active;
          this.pickupCoords = { lat: active.pickupLat, lng: active.pickupLng };
          this.dropCoords = { lat: active.dropLat, lng: active.dropLng };
          localStorage.setItem('activeRideId', activeId.toString());
          if (!this.pollingInterval) {
            this.startTrackingRide(activeId);
          }
        } else {
          const unratedCompleted = this.rideHistory.find((r: any) => 
            r.status === 'COMPLETED' && (r.rating === null || r.rating === undefined)
          );
          if (unratedCompleted && !this.ratedRideId) {
            this.ratedRideId = unratedCompleted.id || unratedCompleted.Id;
            this.showRatingForm = true;
          }
        }
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
        const rideId = response.id || response.Id;
        this.activeRide = response;
        this.showRatingForm = false;
        this.ratedRideId = null;
        localStorage.setItem('activeRideId', rideId.toString());
        this.bookingSuccess = 'Ride requested successfully!';
        this.addNotification('Ride requested successfully! Waiting for driver acceptance...');
        
        this.pickupAddress = '';
        this.dropAddress = '';
        this.travelDate = '';
        this.distanceKm = null;
        this.calculatedFare = null;
        
        this.setActiveTab('active');
        this.startTrackingRide(rideId);
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
    }, 1500);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  pollRideStatus(rideId: number) {
    if (!this.currentUser) return;
    this.passengerService.getRideHistory(this.currentUser.userId).subscribe({
      next: (rides) => {
        const current = (rides || []).find((r: any) => (r.id || r.Id) === rideId);
        if (current) {
          const previousStatus = this.activeRide ? this.activeRide.status : null;
          this.activeRide = current;
          this.pickupCoords = { lat: current.pickupLat, lng: current.pickupLng };
          this.dropCoords = { lat: current.dropLat, lng: current.dropLng };

          this.triggerActiveRideMapUpdate();
          if (previousStatus !== current.status) {
            this.handleStatusNotifications(current);
          }

          if (current.status === 'COMPLETED') {
            this.stopPolling();
            this.message = 'Ride completed successfully! Please rate your trip.';
            this.addNotification('Your ride has completed. Please rate your driver and trip experience!');
            this.ratedRideId = rideId;
            this.ratingData = { rating: 5, feedback: '' };
            this.showRatingForm = true;
            this.activeRide = null;
            localStorage.removeItem('activeRideId');
            this.setActiveTab('active');
            this.loadHistory();
          } else if (current.status === 'CANCELLED') {
            this.stopPolling();
            this.message = 'Ride was cancelled.';
            this.addNotification('Your ride was cancelled.');
            this.activeRide = null;
            this.showRatingForm = false;
            localStorage.removeItem('activeRideId');
            this.loadHistory();
          }
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error polling ride status:', err)
    });
  }

  cancelRide() {
    if (!this.activeRide) return;
    
    const confirmCancel = confirm('Are you sure you want to cancel this ride?');
    if (!confirmCancel) return;

    const rideId = this.activeRide.id || this.activeRide.Id;
    this.passengerService.cancelRide(rideId).subscribe({
      next: () => {
        this.message = 'Ride cancelled successfully.';
        this.addNotification('You cancelled your ride.');
        this.stopPolling();
        this.activeRide = null;
        this.showRatingForm = false;
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
      const driverName = ride.driver?.user?.name || 'Assigned Driver';
      this.addNotification(`Driver ${driverName} accepted your ride! Driver is reaching pickup location.`);
    } else if (ride.status === 'ONGOING' || ride.status === 'IN_RIDE') {
      this.addNotification('Passenger picked up! Your ride is now ongoing to destination.');
    } else if (ride.status === 'COMPLETED') {
      this.addNotification('Trip completed! Please submit your rating and feedback.');
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

  openRatingForRide(rideId: number) {
    this.ratedRideId = rideId;
    this.ratingData = { rating: 5, feedback: '' };
    this.showRatingForm = true;
    this.setActiveTab('active');
  }

  submittingRating = false;

  submitRating() {
    if (!this.ratedRideId || this.submittingRating) return;
    this.submittingRating = true;
    const ratingPayload = {
      rating: this.ratingData.rating,
      feedback: this.ratingData.feedback
    };
    this.passengerService.rateRide(this.ratedRideId, ratingPayload).subscribe({
      next: () => {
        this.submittingRating = false;
        this.message = 'Thank you for your rating & feedback!';
        this.showRatingForm = false;
        this.ratedRideId = null;
        this.ratingData = { rating: 5, feedback: '' };
        this.loadHistory();
        this.setActiveTab('history');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.submittingRating = false;
        console.error('Error rating ride:', err);
        this.message = 'Failed to submit rating. Please try again.';
        this.cdr.detectChanges();
      }
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
      color: '#2563EB',
      weight: 5,
      opacity: 0.85,
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
              color: '#2563EB',
              weight: 5,
              opacity: 0.85,
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
      color: '#2563EB',
      weight: 5,
      opacity: 0.85,
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
    return this.locationService.getLandmarkName(lat, lng);
  }
}