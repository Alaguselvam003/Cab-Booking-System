import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DriverService {
  private apiUrl = 'http://localhost:8080/api/driver';

  constructor(private http: HttpClient) {}

  getDriverProfile(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile/${userId}`);
  }

  toggleAvailability(driverId: number, available: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/${driverId}/availability`, { available });
  }

  updateLocation(driverId: number, latitude: number, longitude: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${driverId}/location`, { latitude, longitude });
  }

  getIncomingRides(): Observable<any> {
    return this.http.get(`${this.apiUrl}/requests`);
  }

  acceptRide(driverId: number, rideId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${driverId}/accept/${rideId}`, {});
  }

  startRide(rideId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/ride/${rideId}/start`, {});
  }

  completeRide(rideId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/ride/${rideId}/complete`, {});
  }

  getRideHistory(driverId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${driverId}/history`);
  }

  getActiveRide(driverId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${driverId}/active-ride`);
  }
}
