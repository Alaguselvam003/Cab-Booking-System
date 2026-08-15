import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
import { LocationService } from '../../core/services/location.service';
import { FareService } from '../../core/services/fare.service';
import { forkJoin, switchMap, map, finalize } from 'rxjs';

declare var L: any;

@Component({
  selector: 'app-home',
  imports: [FormsModule, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
  providers: [DecimalPipe]
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  pickup = '';
  drop = '';
  travelDate = '';
  
  distance: number | null = null;
  fare: number | null = null;
  formattedFare = '₹0.00';
  
  loading = false;
  errorMessage = '';
  successMessage = '';
  todayStr = '';

  private map: any = null;
  private pickupMarker: any = null;
  private dropMarker: any = null;
  private routePolyline: any = null;
  
  private pickupCoords: { lat: number; lng: number } | null = null;
  private dropCoords: { lat: number; lng: number } | null = null;

  constructor(
    private locationService: LocationService,
    private fareService: FareService,
    private router: Router,
    private decimalPipe: DecimalPipe,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user && user.role) {
          if (user.role === 'driver') {
            this.router.navigate(['/driver/dashboard']);
            return;
          } else {
            this.router.navigate(['/passenger/dashboard']);
            return;
          }
        }
      } catch (e) {
        console.error('Error restoring session:', e);
      }
    }
    
    const today = new Date();
    this.todayStr = today.toISOString().split('T')[0];
  }

  ngAfterViewInit() {
    try {
      this.map = L.map('homeMap', {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([13.0827, 80.2707], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);
    } catch (e) {
      console.error('Failed to initialize Leaflet map:', e);
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  onInputChange() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  calculateDistanceAndFare() {
    if (!this.pickup.trim() || !this.drop.trim() || !this.travelDate) {
      this.errorMessage = 'Please enter From, To locations, and select a valid Date.';
      return;
    }

    if (this.pickup.trim().toLowerCase() === this.drop.trim().toLowerCase()) {
      this.errorMessage = 'Pickup and drop locations cannot be the same.';
      return;
    }

    const selectedDate = new Date(this.travelDate);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      this.errorMessage = 'The travel date cannot be in the past.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';


    forkJoin({
      origin: this.locationService.geocode(this.pickup),
      destination: this.locationService.geocode(this.drop)
    }).pipe(
      switchMap((coords) => {
        this.pickupCoords = { lat: coords.origin.lat, lng: coords.origin.lng };
        this.dropCoords = { lat: coords.destination.lat, lng: coords.destination.lng };
        this.cdr.detectChanges();


        return this.locationService.getRoute(
          this.pickupCoords.lat, this.pickupCoords.lng,
          this.dropCoords.lat, this.dropCoords.lng
        );
      }),
      switchMap((route) => {
        this.distance = route.distanceKm;
        this.cdr.detectChanges();


        return this.fareService.calculateFare(route.distanceKm).pipe(
          map((fareRes) => ({
            fareRes,
            route
          }))
        );
      }),
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: ({ fareRes, route }) => {
        this.fare = fareRes.fare;
        const formattedValue = this.decimalPipe.transform(this.fare, '1.2-2');
        this.formattedFare = `₹${formattedValue}`;
        this.updateMap(route.coordinates);
        this.successMessage = 'Estimated distance and fare successfully calculated!';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Fare calculation flow error:', err);
        

        if (err.message && err.message.includes('Location not found')) {
          this.errorMessage = 'One or both of the locations could not be resolved. Please try Chennai landmarks.';
        } else if (err.message && err.message.includes('No driving route')) {
          this.errorMessage = 'Could not calculate road distance between these points.';
        } else {
          this.errorMessage = 'Failed to connect to the backend fare system. Please try again.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  isBookingValid(): boolean {
    return (
      this.pickup.trim().length > 0 &&
      this.drop.trim().length > 0 &&
      this.travelDate.length > 0 &&
      this.distance !== null &&
      this.fare !== null
    );
  }

  continueBooking() {
    if (!this.isBookingValid() || !this.pickupCoords || !this.dropCoords) {
      this.errorMessage = 'Please calculate the fare estimate first before continuing.';
      return;
    }


    const minLat = 12.98;
    const maxLat = 13.10;
    const minLng = 80.15;
    const maxLng = 80.30;

    const mapCoordsToGrid = (lat: number, lng: number) => {
      let row = Math.round(8 - ((lat - minLat) / (maxLat - minLat)) * 7);
      let col = Math.round(((lng - minLng) / (maxLng - minLng)) * 7) + 1;
      return {
        row: Math.max(1, Math.min(8, row)),
        col: Math.max(1, Math.min(8, col))
      };
    };

    const pickupCell = mapCoordsToGrid(this.pickupCoords.lat, this.pickupCoords.lng);
    const dropCell = mapCoordsToGrid(this.dropCoords.lat, this.dropCoords.lng);


    localStorage.setItem('pendingBooking', JSON.stringify({
      pickup: pickupCell,
      drop: dropCell,
      date: this.travelDate,
      pickupAddress: this.pickup,
      dropAddress: this.drop,
      pickupCoords: this.pickupCoords,
      dropCoords: this.dropCoords,
      distanceKm: this.distance,
      calculatedFare: this.fare
    }));


    const currentUserJson = localStorage.getItem('currentUser');
    if (currentUserJson) {
      this.router.navigate(['/passenger/dashboard']);
    } else {
      this.successMessage = 'Estimate saved! Redirecting to login to complete your booking...';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1500);
    }
  }

  private updateMap(coordinates: [number, number][]) {
    if (!this.map || !this.pickupCoords || !this.dropCoords) return;


    if (this.pickupMarker) this.map.removeLayer(this.pickupMarker);
    if (this.dropMarker) this.map.removeLayer(this.dropMarker);
    if (this.routePolyline) this.map.removeLayer(this.routePolyline);


    this.pickupMarker = L.marker([this.pickupCoords.lat, this.pickupCoords.lng], {
      icon: L.divIcon({
        className: 'custom-pickup-marker',
        html: '<i class="bi bi-geo-alt-fill text-success fs-3"></i>',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })
    }).addTo(this.map).bindPopup('Pickup Location').openPopup();

    this.dropMarker = L.marker([this.dropCoords.lat, this.dropCoords.lng], {
      icon: L.divIcon({
        className: 'custom-drop-marker',
        html: '<i class="bi bi-flag-fill text-danger fs-3"></i>',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })
    }).addTo(this.map).bindPopup('Drop Location');


    this.routePolyline = L.polyline(coordinates, {
      color: '#0d6efd',
      weight: 5,
      opacity: 0.8,
      lineJoin: 'round'
    }).addTo(this.map);


    this.map.fitBounds(this.routePolyline.getBounds(), {
      padding: [40, 40]
    });
  }
}