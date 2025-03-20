import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { jwtDecode as jwt_decode } from 'jwt-decode';

// Interfaz para la respuesta del registro
export interface RegisterResponse {
  message: string;
  validation_link: string;
}

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // Realizar login con email y password
  login(credentials: { email: string; password: string }): Observable<{ token: string; expiration: string; nickname: string }> {
    return this.http.post<{ token: string; expiration: string; nickname: string }>(`${this.apiUrl}/login`, credentials);
  }

  // Almacenar el token y su expiración
  saveToken(token: string, expiration: string, nickname: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiration', expiration);
    localStorage.setItem('nickname', nickname);
  }

  // Obtener el token almacenado
  getToken(): string | null {
    const token = localStorage.getItem('token');
    if (token && this.isTokenExpired(token)) {
      this.logout(); // Si el token está expirado, cerrar sesión
      return null;
    }
    return token;
  }

  // Obtener el nickname almacenado
  getNickname(): string | null {
    return localStorage.getItem('nickname');
  }

  getCurrentUser(): { id: number; nickname: string } | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const decodedToken = this.decodeToken(token);
    if (decodedToken) {
      return {
        id: decodedToken.user_id,
        nickname: this.getNickname() || decodedToken.nickname
      };
    }

    return null;
  }

  // Decode the token
  decodeToken(token: string): any {
    try {
      return jwt_decode(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Verificar si el token ha expirado
  isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwt_decode(token); // Decodificar el token correctamente
      const expirationTime = decoded.exp; // Obtener la expiración del token
      const currentTime = Math.floor(Date.now() / 1000); // Obtener el tiempo actual en segundos
      return expirationTime < currentTime; // Verificar si ha expirado
    } catch (error) {
      return true; // Si no se puede decodificar el token, lo consideramos expirado
    }
  }

  //Isloggedin method
  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  // Cerrar sesión
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
  }

  // Registrar un nuevo usuario
  register(credentials: { email: string; password: string; nickname: string }): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, credentials);
  }

  // Fetch all users
  getAllUsers(): Observable<{ id: number; nickname: string }[]> {
    const token = this.getToken();
    if (!token) {
      throw new Error('User is not authenticated');
    }

    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get<{ id: number; nickname: string }[]>(`${this.apiUrl}/users`, { headers });
  }
}
