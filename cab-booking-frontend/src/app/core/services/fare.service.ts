import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FareEstimateResponse {
  distanceKm: number;
  fare: number;
  currency: string;
}

@Injectable({
  providedIn: 'root'
})
export class FareService {

  private apiUrl = 'http://localhost:8080/api/fare/estimate';

  constructor(private http: HttpClient) {}

  calculateFare(distanceKm: number): Observable<FareEstimateResponse> {
    return this.http.post<FareEstimateResponse>(this.apiUrl, { distanceKm });
  }
}
