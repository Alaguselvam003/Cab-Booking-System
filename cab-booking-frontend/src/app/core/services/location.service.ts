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
    { keys: ['velachery', 'phoenix marketcity'], lat: 12.9796, lng: 80.2196, name: 'Velachery, Chennai' },
    { keys: ['egmore', 'egmore railway station'], lat: 13.0783, lng: 80.2599, name: 'Egmore, Chennai' },
    { keys: ['koyambedu', 'cmbt', 'koyambedu bus stand'], lat: 13.0678, lng: 80.2052, name: 'Koyambedu (CMBT), Chennai' },
    { keys: ['tambaram', 'tambaram railway'], lat: 12.9238, lng: 80.1215, name: 'Tambaram, Chennai' },
    { keys: ['nungambakkam', 'loyola college'], lat: 13.0626, lng: 80.2371, name: 'Nungambakkam, Chennai' },
    { keys: ['besant nagar', 'elliots beach', 'elliot beach'], lat: 13.0003, lng: 80.2721, name: 'Besant Nagar, Chennai' },
    { keys: ['thiruvanmiyur', 'tidel park'], lat: 12.9863, lng: 80.2676, name: 'Thiruvanmiyur, Chennai' },
    { keys: ['sholinganallur', 'elcot'], lat: 12.9010, lng: 80.2270, name: 'Sholinganallur, Chennai' },
    { keys: ['chromepet', 'mit chennai'], lat: 12.9520, lng: 80.1410, name: 'Chromepet, Chennai' },
    { keys: ['vadapalani', 'vadapalani temple'], lat: 13.0487, lng: 80.2084, name: 'Vadapalani, Chennai' },
    { keys: ['anna nagar', 'anna nagar tower'], lat: 13.0850, lng: 80.2101, name: 'Anna Nagar, Chennai' },
    { keys: ['saidapet', 'saidapet court'], lat: 13.0200, lng: 80.2200, name: 'Saidapet, Chennai' },
    { keys: ['porur', 'porur junction'], lat: 13.0382, lng: 80.1565, name: 'Porur, Chennai' },
    { keys: ['perungudi', 'perungudi lake'], lat: 12.9654, lng: 80.2461, name: 'Perungudi, Chennai' },
    { keys: ['karapakkam', 'tcs karapakkam'], lat: 12.9202, lng: 80.2289, name: 'Karapakkam, Chennai' },
    { keys: ['pallavaram', 'pallavaram railway'], lat: 12.9675, lng: 80.1491, name: 'Pallavaram, Chennai' },
    { keys: ['medavakkam', 'medavakkam junction'], lat: 12.9179, lng: 80.1923, name: 'Medavakkam, Chennai' }
  ];

  private gridLocationMap: { [key: string]: string } = {
    '1,1': 'Chennai Central Railway Station',
    '1,2': 'George Town Commercial Hub',
    '1,3': 'Parrys Corner',
    '1,4': 'Royapuram Terminal',
    '1,5': 'Tondiarpet Market',
    '1,6': 'Tiruvottiyur High Road',
    '1,7': 'Ennore Express Hub',
    '1,8': 'Manali Industrial Zone',

    '2,1': 'Egmore Railway Station',
    '2,2': 'Kilpauk Medical District',
    '2,3': 'Purusawalkam High Road',
    '2,4': 'Vepery Junction',
    '2,5': 'Perambur Loco Works',
    '2,6': 'Kolathur Junction',
    '2,7': 'Madhavaram CMBT Terminal',
    '2,8': 'Redhills Lake Point',

    '3,1': 'Anna Nagar Tower Park',
    '3,2': 'Shenoy Nagar Metro',
    '3,3': 'Nungambakkam High Road',
    '3,4': 'Thousand Lights (Anna Salai)',
    '3,5': 'Chetpet Eco Park',
    '3,6': 'Aminjikarai Market',
    '3,7': 'Villivakkam Station',
    '3,8': 'Ambattur Industrial Estate',

    '4,1': 'Marina Beach Promenade',
    '4,2': 'Triplicane High Road',
    '4,3': 'T. Nagar (Pondy Bazaar)',
    '4,4': 'Alwarpet Junction',
    '4,5': 'Teynampet (DMS Metro)',
    '4,6': 'Kodambakkam Flyover',
    '4,7': 'Vadapalani Temple Point',
    '4,8': 'Koyambedu CMBT Terminal',

    '5,1': 'Mylapore Kapaleeshwarar Temple',
    '5,2': 'Mandaveli Terminus',
    '5,3': 'Saidapet Court Junction',
    '5,4': 'Nandanam YMCA',
    '5,5': 'Ashok Nagar 11th Avenue',
    '5,6': 'K.K. Nagar Central',
    '5,7': 'Virugambakkam Market',
    '5,8': 'Porur Junction Hub',

    '6,1': 'Besant Nagar (Elliot Beach)',
    '6,2': 'Adyar Signal & Bridge',
    '6,3': 'Guindy Industrial Estate',
    '6,4': 'Velachery Main Road (Phoenix Marketcity)',
    '6,5': 'Madipakkam Koot Road',
    '6,6': 'Adambakkam Junction',
    '6,7': 'Ramapuram DLF Cybercity',
    '6,8': 'Iyyappanthangal Bus Depot',

    '7,1': 'Thiruvanmiyur (TIDEL Park / ECR)',
    '7,2': 'Kottivakkam Beach Road',
    '7,3': 'Chennai International Airport (Meenambakkam)',
    '7,4': 'Pallavaram GST Road',
    '7,5': 'Perungudi OMR Toll Gate',
    '7,6': 'Nanganallur Anjaneyar Temple',
    '7,7': 'Moovarasanpet',
    '7,8': 'Pammal Main Road',

    '8,1': 'Palavakkam ECR Hub',
    '8,2': 'Neelankarai Beach Route',
    '8,3': 'Sholinganallur ELCOT SEZ (OMR)',
    '8,4': 'Karapakkam TCS Center',
    '8,5': 'Tambaram Railway Station',
    '8,6': 'Chromepet MIT Flyover',
    '8,7': 'Medavakkam Junction',
    '8,8': 'Semmancheri IT Expressway'
  };

  constructor(private http: HttpClient) {}

  getLandmarkName(lat: number, lng: number): string {
    if (!lat || !lng) return 'Chennai Central Railway Station';

   
    if (lat >= 1 && lat <= 8 && lng >= 1 && lng <= 8) {
      const row = Math.round(lat);
      const col = Math.round(lng);
      const key = `${row},${col}`;
      if (this.gridLocationMap[key]) {
        return this.gridLocationMap[key];
      }
    }

   
    const tolerance = 0.005;
    const match = this.fallbackLocations.find(loc => 
      Math.abs(loc.lat - lat) < tolerance && Math.abs(loc.lng - lng) < tolerance
    );
    if (match) return match.name;

    let closestLoc = this.fallbackLocations[0];
    let minDist = Number.MAX_VALUE;

    for (const loc of this.fallbackLocations) {
      const dist = this.calculateHaversine(lat, lng, loc.lat, loc.lng);
      if (dist < minDist) {
        minDist = dist;
        closestLoc = loc;
      }
    }

    if (minDist <= 3.0) {
      return closestLoc.name;
    } else if (minDist <= 10.0) {
      return `${closestLoc.name} Area`;
    }

    return closestLoc ? closestLoc.name : 'Chennai City Center';
  }

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
