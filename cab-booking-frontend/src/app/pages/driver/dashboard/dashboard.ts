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

  countdownSeconds = 0;
  isCountingDown = false;
  countdownMessage = '';
  canPickup = false;
  canDrop = false;

  private countdownTimer: any = null;
  private requestsTimer: any = null;
  private activeRideTimer: any = null;
  private historyTimer: any = null;

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
        this.startHistoryPolling();
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
        this.rideHistory = (history || []).sort((a: any, b: any) => {
          return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
        });
      },
      error: (err) => console.error('Error fetching driver history:', err)
    });
  }

  startHistoryPolling() {
    this.stopHistoryPolling();
    this.historyTimer = setInterval(() => {
      this.loadHistory();
    }, 4000);
  }

  stopHistoryPolling() {
    if (this.historyTimer) {
      clearInterval(this.historyTimer);
      this.historyTimer = null;
    }
  }

  toggleAvailability() {
    if (!this.driverProfile) return;
    this.driverService.toggleAvailability(this.driverProfile.driverId, this.driverProfile.isAvailable).subscribe({
      next: (updated) => {
        this.driverProfile.isAvailable = updated.isAvailable;
        this.message = `Availability toggled to: ${updated.isAvailable ? 'AVAILABLE' : 'OFFLINE'}`;
        if (updated.isAvailable) {
          this.pollRequests();
        }
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
    }, 2000);
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
        this.incomingRequests = (data || []).filter((r: any) => r.status === 'REQUESTED' && !r.driver);
      },
      error: (err) => console.error('Error fetching requests:', err)
    });
  }

  startActiveRidePolling() {
    this.stopActiveRidePolling();
    this.pollActiveRide();
    this.activeRideTimer = setInterval(() => {
      this.pollActiveRide();
    }, 2000);
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
          this.updateRideState(ride);
        } else {
          this.activeRide = null;
          this.canPickup = false;
          this.canDrop = false;
        }
      },
      error: (err) => console.error('Error checking active ride:', err)
    });
  }

  checkActiveRide() {
    this.pollActiveRide();
  }

  updateRideState(ride: any) {
    if (ride.status === 'ACCEPTED') {
      if (!this.isCountingDown) {
        this.canPickup = true;
        this.canDrop = false;
        if (!this.countdownMessage) {
          this.countdownMessage = 'Driver has reached the passenger location.';
        }
      }
    } else if (ride.status === 'ONGOING' || ride.status === 'IN_RIDE') {
      this.canPickup = false;
      this.canDrop = true;
      this.countdownMessage = 'Passenger Picked Up. In transit to drop location.';
    } else {
      this.canPickup = false;
      this.canDrop = false;
    }
  }

  acceptRequest(rideId: number) {
    if (!this.driverProfile) return;
    this.driverService.acceptRide(this.driverProfile.driverId, rideId).subscribe({
      next: (acceptedRide) => {
        this.activeRide = acceptedRide;
        this.driverProfile.isAvailable = false;
        this.incomingRequests = [];
        this.startPickupCountdown();
      },
      error: (err) => {
        console.error('Error accepting ride:', err);
        this.message = 'Failed to accept ride. It may have been accepted by another driver or cancelled.';
        this.pollRequests();
      }
    });
  }

  startPickupCountdown() {
    this.stopCountdownTimer();
    this.isCountingDown = true;
    this.canPickup = false;
    this.canDrop = false;
    this.countdownSeconds = 2;
    this.countdownMessage = `Driver is reaching the passenger location... (${this.countdownSeconds}s remaining)`;

    this.countdownTimer = setInterval(() => {
      this.countdownSeconds--;
      if (this.countdownSeconds > 0) {
        this.countdownMessage = `Driver is reaching the passenger location... (${this.countdownSeconds}s remaining)`;
      } else {
        this.stopCountdownTimer();
        this.isCountingDown = false;
        this.canPickup = true;
        this.countdownMessage = 'Driver has reached the passenger location.';
      }
    }, 1000);
  }

  stopCountdownTimer() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  pickupPassenger() {
    if (!this.activeRide || !this.canPickup) return;
    const rideId = this.activeRide.id || this.activeRide.Id;
    this.driverService.pickupRide(rideId).subscribe({
      next: (ongoingRide) => {
        this.activeRide = ongoingRide;
        this.canPickup = false;
        this.canDrop = true;
        this.countdownMessage = 'Passenger Picked Up. In transit to destination.';
        this.message = 'Passenger Picked Up! Head safely to the drop location.';
      },
      error: (err) => {
        console.error('Error picking up passenger:', err);
        this.message = 'Failed to update pickup status. Please try again.';
      }
    });
  }

  dropPassenger() {
    if (!this.activeRide || !this.canDrop) return;
    const rideId = this.activeRide.id || this.activeRide.Id;
    this.driverService.dropRide(rideId).subscribe({
      next: () => {
        this.message = 'Ride Completed Successfully! Driver is now available for new bookings.';
        this.activeRide = null;
        this.canPickup = false;
        this.canDrop = false;
        this.countdownMessage = '';
        this.driverProfile.isAvailable = true;
        this.loadHistory();
        this.loadDriverProfile();
      },
      error: (err) => {
        console.error('Error completing drop:', err);
        this.message = 'Failed to complete ride. Please try again.';
      }
    });
  }

  stopAllTimers() {
    this.stopRequestsPolling();
    this.stopActiveRidePolling();
    this.stopHistoryPolling();
    this.stopCountdownTimer();
  }

  getLandmarkName(lat: number, lng: number): string {
    return this.locationService.getLandmarkName(lat, lng);
  }
}