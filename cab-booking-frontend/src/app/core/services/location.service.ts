import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface LocationCoords {
  lat: number;
  lng: number;
  name: string;
}

export interface RouteResult {
  distanceKm: number;
  coordinates: [number, number][];
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  private fallbackLocations = [
    { keys: ['central', 'chennai central'], lat: 13.0827, lng: 80.2707, name: 'Chennai Central Railway Station' },
    { keys: ['t nagar', 't.nagar', 'thyagaraya nagar'], lat: 13.0418, lng: 80.2341, name: 'T. Nagar, Chennai' },
    { keys: ['adyar', 'adyar bridge'], lat: 13.0012, lng: 80.2565, name: 'Adyar, Chennai' },
    { keys: ['guindy', 'guindy national park'], lat: 13.0067, lng: 80.2206, name: 'Guindy, Chennai' },
    { keys: ['airport', 'chennai airport', 'meenambakkam'], lat: 12.9941, lng: 80.1709, name: 'Chennai International Airport' },
    { keys: ['marina', 'marina beach'], lat: 13.0475, lng: 80.2824, name: 'Marina Beach, Chennai' },
    { keys: ['mylapore', 'kapaleeshwarar'], lat: 13.0330, lng: 80.2690, name: 'Mylapore, Chennai' },
    { keys: ['velachery', 'phoenix marketcity'], lat: 12.9796, lng: 80.2196, name: 'Velachery, Chennai' }
  ];

  constructor(private http: HttpClient) {}

  geocode(query: string): Observable<LocationCoords> {
    if (!query || !query.trim()) {
      return throwError(() => new Error('Location query cannot be empty'));
    }

    const cleanQuery = query.trim().toLowerCase();
    
    const matched = this.fallbackLocations.find(loc => 
      loc.keys.some(key => cleanQuery.includes(key))
    );
    if (matched) {
      return of({ lat: matched.lat, lng: matched.lng, name: matched.name });
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=80.15,13.12,80.32,12.95&bounded=1&limit=1`;
    
    return this.http.get<any[]>(url).pipe(
      map(results => {
        if (results && results.length > 0) {
          return {
            lat: parseFloat(results[0].lat),
            lng: parseFloat(results[0].lon),
            name: results[0].display_name
          };
        }
        throw new Error('Location not found');
      })
    );
  }

  getRoute(fromLat: number, fromLng: number, toLat: number, toLng: number): Observable<RouteResult> {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

    return this.http.get<any>(url).pipe(
      map(response => {
        if (response && response.routes && response.routes.length > 0) {
          const route = response.routes[0];
          const distanceKm = Math.round((route.distance / 1000) * 100) / 100;
          const coords: [number, number][] = route.geometry.coordinates.map((pt: any) => [pt[1], pt[0]]);
          return {
            distanceKm,
            coordinates: coords
          };
        }
        throw new Error('No driving route found between locations');
      })
    );
  }

  private calculateHaversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return Math.round(d * 100) / 100;
  }
}
