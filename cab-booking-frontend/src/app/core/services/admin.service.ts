import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = 'http://localhost:8080/api/admin';

  constructor(private http: HttpClient) {}

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  getAllRides(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/rides`);
  }

  getAllDrivers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/drivers`);
  }

  getAllPassengers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/passengers`);
  }
}
