import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessageComponent } from '../../components/chat-message/chat-message.component';
import { Router, RouterModule } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-direct-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatMessageComponent, RouterModule],
  templateUrl: './direct-chat.component.html',
  styleUrls: ['./direct-chat.component.scss']
})

export class DirectChatComponent implements OnInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  public messages: { message: string; user: string; userId: number; timestamp: string }[] = [];
  public recipientId: string = '';
  public recipientNickname: string = '';
  public messageContent: string = '';
  public currentUser: { id: number; nickname: string } | null = null;

  private limit: number = 10;
  private offset: number = 0;
  public hasMoreMessages: boolean = true;

  public firstArrivedToChat: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService,
    private wsService: WebSocketService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Agregar un redirect si no se ha iniciado sesión
    if (!this.authService.getToken() || !this.authService.getCurrentUser()) {
      this.router.navigate(['/login']);
      return;
    }

    const routeParams = this.route.snapshot.paramMap;
    this.recipientId = routeParams.get('recipientId') || '';
    this.currentUser = this.authService.getCurrentUser();

    // Chequear localStorage
    const reloadKey = `hasReloadedPrivateChat_${this.recipientId}`;
    if (!localStorage.getItem(reloadKey)) {
      // Set the flag to ensure reload happens only once for this channel
      localStorage.setItem(reloadKey, 'true');
      console.log(`Reloading the page for the first time for private channel: ${this.recipientId}`);
      window.location.reload();
    }

    this.loadDirectMessages();

    // Subscribirse al canal privado
    this.wsService.joinDirectChat(this.recipientId, (data) => {
      this.addNewMessage(data);
    });
  }

  goBack(): void {
    window.history.back();
  }

  loadDirectMessages(): void {
    const token = this.authService.getToken();
    const headers = { Authorization: `Bearer ${token}` };

    this.http
      .get<any>(`http://localhost:3000/direct_messages/${this.recipientId}?limit=${this.limit}&offset=${this.offset}`, { headers })
      .subscribe(
        (response) => {
          console.log('response', response);

          // Prepend the new messages to the existing ones
          const newMessages = response.messages.map((msg: any) => ({
            message: msg.content,
            user: msg.sender_nickname,
            userId: msg.sender_id,
            timestamp: msg.timestamp,
          }));

          // Invertir el orden de los mensajes para que los más antiguos estén arriba
          this.messages = [...newMessages.reverse(), ...this.messages];

          // Update recipient nickname
          this.recipientNickname = response.chat_with.nickname;

          // Chequear si hay mas mensajes
          if (newMessages.length < this.limit) {
            this.hasMoreMessages = false;
          }

          // Incrementar el offset
          this.offset += this.limit;

          setTimeout(() => {
            this.scrollToBottom();
          }, 0);
        },
        (error) => {
          console.error('Error loading direct messages:', error);
        }
      );
  }

  addNewMessage(data: any): void {
    console.log('Received WebSocket message:', data);
    const newMessage = {
      message: data.message,
      user: data.sender,
      userId: data.sender_id,
      timestamp: data.timestamp,
    };

    // Asegurar que el mensaje pertenezca a este chat
    if (
      (String(data.sender_id) === String(this.currentUser?.id) && String(data.recipient_id) === String(this.recipientId)) ||
      (String(data.sender_id) === String(this.recipientId) && String(data.recipient_id) === String(this.currentUser?.id))
    ) {

      // Hacer un skip de los mensajes enviados por el usuario actual
      if (String(data.sender_id) === String(this.currentUser?.id)) {
        console.log('Skipping message sent by the current user:', data);
        return;
      }

      // Agregar el mensaje al chat
      console.log('Adding new message to chat:', newMessage);
      console.log('Messages before adding new one:', this.messages);
      this.messages = [...this.messages, newMessage];
      console.log('Messages after adding new one:', this.messages);

      this.cdr.detectChanges(); // Forzar detección de cambios

      setTimeout(() => {
        this.scrollToBottom();
      }, 0);
    } else {
      console.warn('Message does not belong to this chat:', data);
    }
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  sendMessage(): void {
    if (this.messageContent.trim()) {
      const newMessage = {
        message: this.messageContent,
        user: this.currentUser?.nickname || 'You',
        userId: this.currentUser?.id || 0,
        timestamp: new Date().toISOString(),
      };

      // Agregar el mensaje al chat localmente
      console.log('Adding sent message to chat:', newMessage);
      this.messages = [...this.messages, newMessage];

      setTimeout(() => {
        this.scrollToBottom();
      }, 0);

      // Enviar el mensaje por WebSocket
      this.wsService.sendDirectMessage(this.recipientId, this.messageContent);

      // Limpiar el contenido del mensaje
      this.messageContent = '';
    }
  }
}
