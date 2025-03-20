import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  title = 'chat_app_frontend';

  constructor(private authService: AuthService) {}

  // Chequear si el usuario está logueado
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  // Obtener el nickname del usuario
  get userNickname(): string {
    const nickname = this.authService.getNickname();
    return nickname
      ? nickname.charAt(0).toUpperCase() + nickname.slice(1).toLowerCase()
      : 'Usuario';
  }

  // Logout the user
  logout(): void {
    this.authService.logout();
    window.location.reload();
  }
}
