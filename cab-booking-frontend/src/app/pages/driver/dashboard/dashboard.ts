import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DriverService } from '../../../core/services/driver.service';
import { LocationService } from '../../../core/services/location.service';

@Component({
  selector: 'app-driver-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DriverDashboardComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  driverProfile: any = null;
  incomingRequests: any[] = [];
  activeRide: any = null;
  rideHistory: any[] = [];
  message = '';

  requestsTimer: any = null;
  activeRideTimer: any = null;
  simTimer: any = null;

  isSimulating = false;

  constructor(
    private driverService: DriverService, 
    private router: Router,
    private locationService: LocationService
  ) {}

  ngOnInit() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUser = JSON.parse(userJson);
    this.loadDriverProfile();
  }

  ngOnDestroy() {
    this.stopAllTimers();
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.stopAllTimers();
    this.router.navigate(['/login']);
  }

  loadDriverProfile() {
    if (!this.currentUser) return;
    this.driverService.getDriverProfile(this.currentUser.userId).subscribe({
      next: (profile) => {
        this.driverProfile = profile;
        this.loadHistory();
        this.checkActiveRide();
        
        this.startRequestsPolling();
        this.startActiveRidePolling();
      },
      error: (err) => {
        console.error('Error loading driver profile:', err);
        this.message = 'Error loading driver profile. Make sure you are registered as a driver.';
      }
    });
  }

  loadHistory() {
    if (!this.driverProfile) return;
    this.driverService.getRideHistory(this.driverProfile.driverId).subscribe({
      next: (history) => {
        this.rideHistory = history.sort((a: any, b: any) => {
          return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
        });
      },
      error: (err) => console.error('Error fetching driver history:', err)
    });
  }

  toggleAvailability() {
    if (!this.driverProfile) return;
    this.driverService.toggleAvailability(this.driverProfile.driverId, this.driverProfile.isAvailable).subscribe({
      next: (updated) => {
        this.driverProfile.isAvailable = updated.isAvailable;
        this.message = `Availability toggled to: ${updated.isAvailable ? 'AVAILABLE' : 'OFFLINE'}`;
      },
      error: (err) => console.error('Error toggling availability:', err)
    });
  }

  onAvailabilityChange(event: any) {
    if (!this.driverProfile) return;
    this.driverProfile.isAvailable = event.target.checked;
    this.toggleAvailability();
  }

  startRequestsPolling() {
    this.stopRequestsPolling();
    this.pollRequests();
    this.requestsTimer = setInterval(() => {
      this.pollRequests();
    }, 4000);
  }

  stopRequestsPolling() {
    if (this.requestsTimer) {
      clearInterval(this.requestsTimer);
      this.requestsTimer = null;
    }
  }

  pollRequests() {
    if (!this.driverProfile || !this.driverProfile.isAvailable || this.activeRide) {
      this.incomingRequests = [];
      return;
    }
    this.driverService.getIncomingRides().subscribe({
      next: (data) => {
        this.incomingRequests = data;
      },
      error: (err) => console.error('Error fetching requests:', err)
    });
  }

  startActiveRidePolling() {
    this.stopActiveRidePolling();
    this.pollActiveRide();
    this.activeRideTimer = setInterval(() => {
      this.pollActiveRide();
    }, 4000);
  }

  stopActiveRidePolling() {
    if (this.activeRideTimer) {
      clearInterval(this.activeRideTimer);
      this.activeRideTimer = null;
    }
  }

  pollActiveRide() {
    if (!this.driverProfile) return;
    this.driverService.getActiveRide(this.driverProfile.driverId).subscribe({
      next: (ride) => {
        if (ride) {
          this.activeRide = ride;
          this.incomingRequests = [];
        } else {
          this.activeRide = null;
        }
      },
      error: (err) => console.error('Error checking active ride:', err)
    });
  }

  checkActiveRide() {
    this.pollActiveRide();
  }

  acceptRequest(rideId: number) {
    if (!this.driverProfile) return;
    this.driverService.acceptRide(this.driverProfile.driverId, rideId).subscribe({
      next: (acceptedRide) => {
        this.activeRide = acceptedRide;
        this.driverProfile.isAvailable = false;
        this.message = 'Ride request accepted! Prepare to pickup the passenger.';
        this.incomingRequests = [];
        
        this.driverService.updateLocation(this.driverProfile.driverId, 1.0, 1.0).subscribe({
          next: (profile) => { this.driverProfile = profile; }
        });
      },
      error: (err) => {
        console.error('Error accepting ride:', err);
        this.message = 'Failed to accept ride. It may have been accepted by another driver or cancelled.';
      }
    });
  }

  startRide() {
    if (!this.activeRide) return;
    this.driverService.startRide(this.activeRide.Id).subscribe({
      next: (startedRide) => {
        this.activeRide = startedRide;
        this.message = 'Ride started! Head to the drop-off location.';
      },
      error: (err) => console.error('Error starting ride:', err)
    });
  }

  completeRide() {
    if (!this.activeRide) return;
    this.stopSimulation();
    this.driverService.completeRide(this.activeRide.Id).subscribe({
      next: () => {
        this.message = 'Ride completed successfully!';
        this.activeRide = null;
        this.driverProfile.isAvailable = true;
        this.loadHistory();
        this.loadDriverProfile();
      },
      error: (err) => console.error('Error completing ride:', err)
    });
  }

  startLocationSimulation() {
    if (!this.activeRide || !this.driverProfile) return;
    this.isSimulating = true;
    this.stopSimulationTimer();

    this.simTimer = setInterval(() => {
      this.simulationStep();
    }, 1500);
  }

  stopSimulation() {
    this.isSimulating = false;
    this.stopSimulationTimer();
  }

  stopSimulationTimer() {
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
  }

  simulationStep() {
    if (!this.activeRide || !this.driverProfile) {
      this.stopSimulation();
      return;
    }

    let targetLat = 0;
    let targetLng = 0;

    if (this.activeRide.status === 'ACCEPTED') {
      targetLat = this.activeRide.pickupLat;
      targetLng = this.activeRide.pickupLng;
    } else if (this.activeRide.status === 'IN_RIDE') {
      targetLat = this.activeRide.dropLat;
      targetLng = this.activeRide.dropLng;
    } else {
      this.stopSimulation();
      return;
    }

    let currentLat = this.driverProfile.currentLatitude || 1.0;
    let currentLng = this.driverProfile.currentLongitude || 1.0;

    const latDiff = targetLat - currentLat;
    const lngDiff = targetLng - currentLng;
    

    const step = (Math.abs(latDiff) > 1.5 || Math.abs(lngDiff) > 1.5) ? 1.0 : 0.005;

    if (Math.abs(latDiff) <= step) {
      currentLat = targetLat;
    } else {
      currentLat += latDiff > 0 ? step : -step;
    }

    if (Math.abs(lngDiff) <= step) {
      currentLng = targetLng;
    } else {
      currentLng += lngDiff > 0 ? step : -step;
    }

    this.driverService.updateLocation(this.driverProfile.driverId, currentLat, currentLng).subscribe({
      next: (profile) => {
        this.driverProfile = profile;
        
        if (currentLat === targetLat && currentLng === targetLng) {
          this.stopSimulation();
          if (this.activeRide.status === 'ACCEPTED') {
            this.message = 'Arrived at pickup location! You can now start the ride.';
          } else {
            this.message = 'Arrived at drop-off location! You can now complete the ride.';
          }
        }
      },
      error: (err) => {
        console.error('Error simulating step:', err);
        this.stopSimulation();
      }
    });
  }

  stopAllTimers() {
    this.stopRequestsPolling();
    this.stopActiveRidePolling();
    this.stopSimulationTimer();
  }

  getLandmarkName(lat: number, lng: number): string {
    return this.locationService.getLandmarkName(lat, lng);
  }
}