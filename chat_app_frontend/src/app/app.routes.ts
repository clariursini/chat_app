import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { ChannelComponent } from './pages/channel/channel.component';
import { ChatComponent } from './pages/chat/chat.component';
import { DirectChatComponent } from './pages/direct-chat/direct-chat.component';
import { RootComponent } from './pages/root/root.component';

export const routes: Routes = [
  { path: '', component: RootComponent }, // Root path handled by RootComponent
  { path: 'login', component: LoginComponent },
  { path: 'channel', component: ChannelComponent },
  { path: 'chat/:channelId', component: ChatComponent },
  { path: 'direct-chat/:currentUserId/:recipientId', component: DirectChatComponent },
];
