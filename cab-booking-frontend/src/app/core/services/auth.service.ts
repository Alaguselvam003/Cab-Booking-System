import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl='http://localhost:8080/api/auth/';
  constructor(private http:HttpClient){}
  register(user: any):Observable<any>{
    return this.http.post(`${this.apiUrl}register`,user);
  }
  login(credentials:any):Observable<any>{
    return this.http.post(`${this.apiUrl}login`,credentials);
  }
  forgotPassword(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}forgot-password`, payload);
  }
}
