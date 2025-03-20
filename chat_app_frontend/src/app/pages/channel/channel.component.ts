import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { ChannelService } from '../../services/channel.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { WebSocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.scss']
})
export class ChannelComponent implements OnInit {
  public subscribedChannels: any[] = [];
  public remainingPublicChannels: any[] = [];
  public directMessages: any[] = [];
  public errorMessage: string | null = null;
  public showCreateChannelForm = false; // Add this property to toggle the form
  public newChannel: { name: string; description: string } = { name: '', description: '' };
  public formErrorMessage: string | null = null; // Error específico del formulario

  public allUsers: { id: number; nickname: string }[] = []; // List of all users
  public selectedUser: { id: number; nickname: string } | null = null; // Selected user for direct message
  public directMessageContent: string = ''; // Content of the direct message
  public showUserDropdown: boolean = false; // Toggle for the user dropdown

  currentUser: { id: number; nickname: string } | null = null;

  constructor(
    private channelService: ChannelService,
    private authService: AuthService,
    private router: Router,
    private wsService: WebSocketService,
  ) {}

  ngOnInit(): void {
    // Check if the user is logged in
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']); // Redirect to login if not logged in
      return;
    }

    const token = this.authService.getToken();
    this.currentUser = this.authService.getCurrentUser();

    if (token && this.currentUser) {
      this.channelService.getChannels(token).subscribe({
        next: (response) => {
          this.subscribedChannels = response.subscribed_channels;
          this.remainingPublicChannels = response.remaining_public_channels;
          this.directMessages = response.direct_messages;
        },
        error: (error) => {
          console.error('Error al obtener los canales:', error);
          this.errorMessage = 'Error al obtener los canales.';
        }
      });
      // Get all users
      this.authService.getAllUsers().subscribe({
        next: (response) => {
          this.allUsers = response;
        },
        error: (error) => {
          console.error('Error al obtener los usuarios:', error);
          this.errorMessage = 'Error al obtener los usuarios.';
        }
      })
    } else {
      this.errorMessage = 'No estas logueado. Por favor, inicia sesión.';
    }
  }

  // Toggle the create channel form
  toggleCreateChannelForm(): void {
    this.showCreateChannelForm = !this.showCreateChannelForm;

    // Reset the form inputs when toggling
    if (!this.showCreateChannelForm) {
      this.newChannel = { name: '', description: '' };
      this.formErrorMessage = null;
    }
  }

  // Create a new channel
  createChannel(): void {
    if (!this.newChannel.name.trim()) {
      this.formErrorMessage = 'El nombre del canal es obligatorio.';
      return;
    }

    const token = this.authService.getToken();
    if (token) {
      this.channelService.createChannel(this.newChannel, token).subscribe({
        next: (channel) => {
          this.remainingPublicChannels.push(channel); // Agregar el nuevo canal a la lista
          this.newChannel = { name: '', description: '' }; // Reiniciar el formulario
          this.showCreateChannelForm = false; // Cerrar el formulario
          this.formErrorMessage = null; // Limpiar el mensaje de error del formulario
        },
        error: (error) => {
          console.error('Error al crear el canal:', error);
          this.formErrorMessage = 'Error al crear el canal. Por favor, intenta nuevamente.'; // Mostrar error en el formulario
        }
      });
    } else {
      this.formErrorMessage = 'No estás autenticado. Por favor, inicia sesión.'; // Mostrar error en el formulario
    }
  }

  // Toggle the user dropdown
  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
  }

  // Open the form to send a direct message
  openDirectMessageForm(user: { id: number; nickname: string }): void {
    this.selectedUser = user;
    this.directMessageContent = ''; // Reset the message content
    this.showUserDropdown = false; // Close the dropdown
  }

  // Close the direct message form
  closeDirectMessageForm(): void {
    this.selectedUser = null;
    this.directMessageContent = '';
  }

  sendDirectMessage(subscriber: { id: number; nickname: string }, messageContent: string): void {
    if (!subscriber) {
      console.error('No recipient selected.');
      return;
    }

    if (!messageContent.trim()) {
      console.error('Message content is empty.');
      return;
    }

    // Subscribe to the private chat channel
    this.wsService.joinDirectChat(subscriber.id.toString(), (data) => {});
    // Use the WebSocketService to send the direct message
    this.wsService.sendDirectMessage(subscriber.id.toString(), messageContent);

    // Redirect to the direct chat with the recipient and pass the message as navigation state
    const currentUserId = this.currentUser?.id;
    if (currentUserId) {
      console.log('Redirecting to direct chat:', currentUserId, subscriber.id);
      this.router.navigate(['/direct-chat', currentUserId, subscriber.id], {
        state: {
          newMessage: {
            message: messageContent,
            user: this.currentUser?.nickname || 'You',
            userId: this.currentUser?.id || 0,
            timestamp: new Date().toISOString(),
          },
        },
      });

      // Reset the resetReloadFlag
      const reloadKey = `hasReloadedPrivateChat_${subscriber.id}`;
      localStorage.removeItem(reloadKey);
      console.log(`Reload flag reset for private channel: ${subscriber.id}`);
    } else {
      console.error('Current user ID is missing.');
    }
  }

  resetReloadFlag(channelId: string): void {
    const reloadKey = `hasReloadedPublicChat_${channelId}`;
    localStorage.removeItem(reloadKey);
    console.log(`Reload flag reset for channel: ${channelId}`);
  }

  resetPrivateReloadFlag(userId: number): void {
    const reloadKey = `hasReloadedPrivateChat_${userId}`;
    localStorage.removeItem(reloadKey);
    console.log(`Reload flag reset for private channel: ${userId}`);
  }
}
