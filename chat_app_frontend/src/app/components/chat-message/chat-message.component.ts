import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.scss']
})
export class ChatMessageComponent implements OnInit {
  @Input() message: { message: string; user: string; userId: number; timestamp: string } | null = null;
  @Input() currentUserId: number | null = null; // Current user's ID
  formattedTimestamp: string = '';
  isSentByCurrentUser: boolean = false;

  ngOnInit(): void {
    if (this.message) {
      this.formattedTimestamp = this.formatTimestamp(this.message.timestamp);
      this.isSentByCurrentUser = this.message.userId === this.currentUserId; // Check if the message is sent by the current user
    }
  }

  private formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);

    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', timestamp);
      return 'Invalid Date';
    }

    // Use Intl.DateTimeFormat for formatting
    return new Intl.DateTimeFormat('default', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // Use 24-hour format
    }).format(date);
  }
}
