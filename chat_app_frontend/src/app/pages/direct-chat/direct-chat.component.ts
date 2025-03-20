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

  private limit: number = 10; // Number of messages to load per request
  private offset: number = 0; // Current offset for pagination
  public hasMoreMessages: boolean = true; // Whether there are more messages to load

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
    // Add a redirect to log in if no token
    if (!this.authService.getToken() || !this.authService.getCurrentUser()) {
      this.router.navigate(['/login']);
      return;
    }

    const routeParams = this.route.snapshot.paramMap;
    this.recipientId = routeParams.get('recipientId') || '';
    this.currentUser = this.authService.getCurrentUser();
    this.firstArrivedToChat = true;

    // Check for a new message passed via navigation state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { newMessage?: any };
    if (state?.newMessage) {
      console.log('Adding new message from navigation state:', state.newMessage);
      this.messages.push(state.newMessage);
      setTimeout(() => {
        this.scrollToBottom();
      }, 0);
    }

    this.loadDirectMessages();

    // Subscribe to the private chat channel
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

          // Check if there are more messages to load
          if (newMessages.length < this.limit) {
            this.hasMoreMessages = false;
          }

          // Increment the offset for the next request
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

    // Ensure the message is relevant to the current chat
    if (
      (String(data.sender_id) === String(this.currentUser?.id) && String(data.recipient_id) === String(this.recipientId)) ||
      (String(data.sender_id) === String(this.recipientId) && String(data.recipient_id) === String(this.currentUser?.id))
    ) {

      // Skip message if i am seding the message
      // if (String(data.sender_id) === String(this.currentUser?.id)) {
      //   console.log('Skipping message sent by the current user:', data);
      //   return;
      // }

      // Prepend the new message to the messages array
      console.log('Adding new message to chat:', newMessage);

      // Prepend the new message to the messages array
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

      // If firstArrivedToChat to true, renew suscription
      if (this.firstArrivedToChat) {
        console.log("ejecutando first arrived to chat")
        // Renew suscription
        this.wsService.joinDirectChat(this.recipientId, (data) => {
          this.addNewMessage(data);
        })
        this.firstArrivedToChat = false;
      }

      // Add the message locally for the sender skip if i am seding the message
      console.log('Adding sent message to chat:', newMessage);
      this.messages = [...this.messages, newMessage];

      // this.messages.push(newMessage);
      setTimeout(() => {
        this.scrollToBottom();
      }, 0);

      // Send the message via WebSocket
      this.wsService.sendDirectMessage(this.recipientId, this.messageContent);

      // Clear the input field
      this.messageContent = '';
    }
  }
}
