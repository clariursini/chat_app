import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true, // Mark as standalone
  template: '', // No template needed; we will handle navigation in the logic
})
export class RootComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/channel']); // Navigate to channel if logged in
    } else {
      this.router.navigate(['/login']); // Navigate to login if not logged in
    }
  }
}
