import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebSocketService } from '../../services/websocket.service';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessageComponent } from '../../components/chat-message/chat-message.component';
import { SubscribersComponent } from '../../components/subscribers/subscribers.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatMessageComponent, SubscribersComponent, ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  public subscribers: { id: number; nickname: string }[] = [];
  public selectedRecipient: { id: number; nickname: string } | null = null;
  public directMessageContent: string = '';

  channelId: string = '';
  channelName: string = '';
  channelDescription: string = '';
  isSubscribed: boolean = false;
  message = '';
  messages: { message: string; user: string; userId: number; timestamp: string }[] = [];
  currentUser: { id: number; nickname: string } | null = null;

  // Agregar variables para la paginación
  limit: number = 10;
  offset: number = 0;
  hasMoreMessages: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private wsService: WebSocketService,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Redireccionar al login si el usuario no está autenticado
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.channelId = this.route.snapshot.paramMap.get('channelId') || '';
    this.currentUser = this.authService.getCurrentUser();

    // Chequear localStorage
    const reloadKey = `hasReloadedPublicChat_${this.channelId}`;
    if (!localStorage.getItem(reloadKey)) {
      // Setear la flag para que solo se recargue la página una vez
      localStorage.setItem(reloadKey, 'true');
      console.log(`Reloading the page for the first time for channel: ${this.channelId}`);
      window.location.reload();
    }
    this.loadChannelMessages();
    this.wsService.joinChannel(this.channelId, (data) => {
      this.addNewMessage(data);
    });
  }

  loadChannelMessages(): void {
    const token = this.authService.getToken();

    if (!token) {
      console.error('Token is missing. Unable to load channel messages.');
      this.router.navigate(['/login']);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any>(`http://localhost:3000/channels/${this.channelId}?limit=${this.limit}&offset=${this.offset}`, { headers }).subscribe(
      (response) => {
        console.log('Loaded channel messages:', response);
        const newMessages  = response.messages.map((msg: any) => ({
          message: msg.content,
          user: msg.user,
          userId: msg.user_id,
          timestamp: msg.created_at,
        }));
        this.channelName = response.channel;
        this.channelDescription = response.description;
        this.isSubscribed = response.is_subscribed;
        this.subscribers = response.subscribers;

        // Prepend nuevos mensajes para mantener el orden
        this.messages = [...newMessages.reverse(), ...this.messages];

        // Update offset
        this.offset += this.limit;

        // Chequear si hay mas mensajes
        this.hasMoreMessages = response.messages.length >= this.limit;

        // Esperar y desplazarse hacia abajo
        setTimeout(() => {
          this.scrollToBottom();
        }, 0);
      },
      (error) => {
        console.error('Error loading channel messages:', error);
      }
    );
  }

  private addNewMessage(data: any): void {
    const newMessage = {
      message: data.message,
      user: data.user,
      userId: data.user_id,
      timestamp: data.timestamp
    };
    this.messages = [...this.messages, newMessage];
    console.log("Updated messages array:", this.messages);
    // Esperar y desplazarse hacia abajo
    setTimeout(() => {
      this.scrollToBottom();
    }, 0);
  }


  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  sendMessage(): void {
    if (this.message.trim()) {
      this.wsService.sendMessage(this.channelId, this.message);
      this.message = '';
    }
  }

  goBack(): void {
    window.history.back();
  }

  subscribeToChannel(): void {
    const token = this.authService.getToken();

    if (!token) {
      console.error('Token is missing. Unable to subscribe to the channel.');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    this.http.post<any>(`http://localhost:3000/channels/${this.channelId}/subscribe`, {}, { headers }).subscribe(
      (response) => {
        console.log(response.message);
        this.isSubscribed = true;
        // Update subscriptors
        this.subscribers = response.subscribers;
      },
      (error) => {
        console.error('Error subscribing to channel:', error);
      }
    );
  }

  unsubscribeFromChannel(): void {
    if (!confirm('¿Estás seguro de que deseas desuscribirte de este canal?')) {
      return;
    }

    const token = this.authService.getToken();

    if (!token) {
      console.error('Token is missing. Unable to unsubscribe from the channel.');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    this.http.delete<any>(`http://localhost:3000/channels/${this.channelId}/unsubscribe`, { headers }).subscribe(
      (response) => {
        console.log(response.message);
        this.isSubscribed = false;
        this.subscribers = response.subscribers;
      },
      (error) => {
        console.error('Error unsubscribing from channel:', error);
      }
    );
  }

  // Direct messages
  openDirectMessageForm(subscriber: { id: number; nickname: string }): void {
    this.selectedRecipient = subscriber;
  }

  closeDirectMessageForm(): void {
    this.selectedRecipient = null;
    this.directMessageContent = '';
  }

  sendDirectMessage(): void {
    if (!this.selectedRecipient) {
      console.error('No recipient selected.');
      return;
    }

    const token = this.authService.getToken();
    const headers = { Authorization: `Bearer ${token}` };

    this.http.post<any>(
      'http://localhost:3000/messages',
      {
        direct_recipient_id: this.selectedRecipient.id,
        content: this.directMessageContent
      },
      { headers }
    ).subscribe(
      (response) => {
        console.log('Direct message sent:', response.message);
        this.closeDirectMessageForm();

        // Redireccionar al chat directo
        const currentUserId = this.currentUser?.id;
        if (currentUserId) {
          if (this.selectedRecipient) {
            console.log('Redirecting to direct chat:', currentUserId, this.selectedRecipient.id);
            this.router.navigate(['/direct-chat', currentUserId, this.selectedRecipient.id]);
          } else {
            console.error('Selected recipient is null.');
          }
        } else {
          console.error('Current user ID is missing.');
        }
      },
      (error) => {
        console.error('Error sending direct message:', error);
      }
    );
  }

  sendDirectMessageGoToChat(subscriber: { id: number; nickname: string }, messageContent: string): void {
    if (!subscriber) {
      console.error('No recipient selected.');
      return;
    }

    if (!messageContent.trim()) {
      console.error('Message content is empty.');
      return;
    }

    // Subscribirse al canal privado
    this.wsService.joinDirectChat(subscriber.id.toString(), (data) => {});
    // Usar el WebSocketService para enviar el mensaje
    this.wsService.sendDirectMessage(subscriber.id.toString(), messageContent);

    // Redireccionar al chat directo
    const currentUserId = this.currentUser?.id;
    if (currentUserId) {
      console.log('Redirecting to direct chat:', currentUserId, subscriber.id);
      this.router.navigate(['/direct-chat', currentUserId, subscriber.id]);
    } else {
      console.error('Current user ID is missing.');
    }

    // Reset the resetReloadFlag
    const reloadKey = `hasReloadedPrivateChat_${subscriber.id}`;
    localStorage.removeItem(reloadKey);
    console.log(`Reload flag reset for private channel: ${subscriber.id}`);
  }
}
