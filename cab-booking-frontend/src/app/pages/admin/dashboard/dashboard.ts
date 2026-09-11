import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { LocationService } from '../../../core/services/location.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  providers: [DecimalPipe, DatePipe]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  loading: boolean = false;
  activeTab: 'rides' | 'drivers' | 'passengers' = 'rides';
  searchQuery: string = '';
  statusFilter: string = 'ALL';
  currentUser: any = null;

  stats: any = {
    totalFleet: 0,
    activeDrivers: 0,
    totalRides: 0,
    completedRides: 0,
    ongoingRides: 0,
    requestedRides: 0,
    totalRevenue: 0,
    totalPassengers: 0
  };

  rides: any[] = [];
  drivers: any[] = [];
  passengers: any[] = [];

  private pollingTimer: any = null;

  constructor(
    private adminService: AdminService,
    private locationService: LocationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUser = JSON.parse(userJson);
    if (this.currentUser.role !== 'admin' && this.currentUser.email !== 'admin@gmail.com') {
      this.router.navigate(['/login']);
      return;
    }

    this.loadAdminData();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  startPolling(): void {
    this.stopPolling();
    this.pollingTimer = setInterval(() => {
      this.loadAdminData(true);
    }, 5000);
  }

  stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  loadAdminData(isBackground: boolean = false): void {
    if (!isBackground) {
      this.loading = true;
      this.cdr.detectChanges();
    }

    forkJoin({
      stats: this.adminService.getStats(),
      rides: this.adminService.getAllRides(),
      drivers: this.adminService.getAllDrivers(),
      passengers: this.adminService.getAllPassengers()
    }).subscribe({
      next: (res) => {
        if (res.stats) {
          this.stats = res.stats;
        }
        this.rides = (res.rides || []).sort((a: any, b: any) => {
          return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
        });
        this.drivers = res.drivers || [];
        this.passengers = res.passengers || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load admin data', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getLandmarkName(lat: any, lng: any): string {
    if (lat == null || lng == null) return 'Unknown Landmark';
    return this.locationService.getLandmarkName(Number(lat), Number(lng));
  }

  get filteredRides(): any[] {
    return this.rides.filter(ride => {
      const matchesStatus = this.statusFilter === 'ALL' || 
        ride.status === this.statusFilter || 
        (this.statusFilter === 'ONGOING' && (ride.status === 'ONGOING' || ride.status === 'IN_RIDE'));
      const passengerName = (ride.passenger?.name || '').toLowerCase();
      const passengerPhone = String(ride.passenger?.phone || '').toLowerCase();
      const driverName = (ride.driver?.user?.name || '').toLowerCase();
      const rideId = String(ride.id || ride.Id || '');
      const query = this.searchQuery.toLowerCase().trim();

      const matchesQuery = !query || 
        passengerName.includes(query) || 
        passengerPhone.includes(query) || 
        driverName.includes(query) || 
        rideId.includes(query);

      return matchesStatus && matchesQuery;
    });
  }

  get filteredDrivers(): any[] {
    return this.drivers.filter(d => {
      const name = (d.user?.name || '').toLowerCase();
      const email = (d.user?.email || '').toLowerCase();
      const phone = String(d.user?.phone || '');
      const plate = (d.vehicle?.numberplate || '').toLowerCase();
      const type = (d.vehicle?.type || '').toLowerCase();
      const query = this.searchQuery.toLowerCase().trim();

      return !query || 
        name.includes(query) || 
        email.includes(query) || 
        phone.includes(query) || 
        plate.includes(query) || 
        type.includes(query);
    });
  }

  get filteredPassengers(): any[] {
    return this.passengers.filter(p => {
      const name = (p.name || '').toLowerCase();
      const email = (p.email || '').toLowerCase();
      const phone = String(p.phone || '');
      const query = this.searchQuery.toLowerCase().trim();

      return !query || 
        name.includes(query) || 
        email.includes(query) || 
        phone.includes(query);
    });
  }

  getDriverCompletedRidesCount(driverId: number): number {
    return this.rides.filter(r => r.driver?.driverId === driverId && r.status === 'COMPLETED').length;
  }

  getDriverTotalEarnings(driverId: number): number {
    return this.rides
      .filter(r => r.driver?.driverId === driverId && r.status === 'COMPLETED' && r.fare)
      .reduce((sum, r) => sum + Number(r.fare), 0);
  }

  getDriverActiveRide(driverId: number): any {
    return this.rides.find(r => r.driver?.driverId === driverId && (r.status === 'ACCEPTED' || r.status === 'ONGOING' || r.status === 'IN_RIDE'));
  }

  getPassengerRidesCount(passengerId: number): number {
    return this.rides.filter(r => (r.passenger?.id === passengerId || r.passenger?.userId === passengerId)).length;
  }

  setActiveTab(tab: 'rides' | 'drivers' | 'passengers'): void {
    this.activeTab = tab;
    this.searchQuery = '';
    this.cdr.detectChanges();
  }
}
