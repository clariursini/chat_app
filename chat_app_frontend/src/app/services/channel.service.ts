import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  private apiUrl = 'http://localhost:3000/channels'; // Replace with your backend URL

  constructor(private http: HttpClient) {}

  // Fetch channels
  getChannels(token: string): Observable<any> {
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get<any>(`${this.apiUrl}`, { headers });
  }

  // Create a new channel
  createChannel(channel: { name: string; description: string }, token: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}` // Add the token to the Authorization header
    });

    return this.http.post<any>(this.apiUrl, channel, { headers });
  }
}
