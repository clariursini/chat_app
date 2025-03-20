import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true, // Mark as standalone
  imports: [RouterOutlet, CommonModule], // Import RouterOutlet for routing
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  title = 'chat_app_frontend';

  constructor(private authService: AuthService) {}

  // Check if the user is logged in
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  // Get the user's nickname
  get userNickname(): string {
    const nickname = this.authService.getNickname();
    return nickname
      ? nickname.charAt(0).toUpperCase() + nickname.slice(1).toLowerCase()
      : 'Usuario';
  }

  // Logout the user
  logout(): void {
    this.authService.logout();
    window.location.reload(); // Reload the page to reset the state
  }
}
