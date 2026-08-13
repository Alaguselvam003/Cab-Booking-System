import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PassengerService {
  private apiUrl = 'http://localhost:8080/api/auth/passenger';

  constructor(private http: HttpClient) {}

  requestRide(ride: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ride/request`, ride);
  }

  getFareEstimate(ride: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/fare-estimate`, ride);
  }

  getRideHistory(passengerId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/ride/history/${passengerId}`);
  }

  getDriverLocation(rideId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/ride/${rideId}/location`);
  }

  rateRide(rideId: number, ratingData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ride/${rideId}/rate`, ratingData);
  }

  cancelRide(rideId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/ride/${rideId}/cancel`, {});
  }

  updateProfile(passengerId: number, profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile/${passengerId}`, profileData);
  }
}