import { NgModule } from '@angular/core';
import { RouterModule, Routes, ResolveFn, Router } from '@angular/router';
import { LoginComponent } from '../pages/login/login.component';
import { ChatComponent } from '../pages/chat/chat.component';
import { ChannelComponent } from '../pages/channel/channel.component';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

const redirectToBasedOnAuth: ResolveFn<void> = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  console.log('is logged in routing', authService.isLoggedIn());
  if (authService.isLoggedIn()) {
    router.navigate(['/channel']); // Redirect to channel if logged in
  } else {
    router.navigate(['/login']); // Redirect to login if not logged in
  }
};

const routes: Routes = [
  { path: '', resolve: { redirect: redirectToBasedOnAuth } }, // Use resolve to handle redirection
  { path: 'login', component: LoginComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'channel', component: ChannelComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
