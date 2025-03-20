import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subscribers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscribers.component.html',
  styleUrls: ['./subscribers.component.scss']
})
export class SubscribersComponent {
  @Input() subscribers: { id: number; nickname: string }[] = [];
  @Input() currentUserId: number | null = null; // Accept the current user's ID
  @Output() directMessage = new EventEmitter<{ id: number; nickname: string }>();

  public showSubscribersDropdown: boolean = false;

  toggleSubscribersDropdown(): void {
    this.showSubscribersDropdown = !this.showSubscribersDropdown;
  }

  sendDirectMessage(subscriber: { id: number; nickname: string }): void {
    this.directMessage.emit(subscriber);
    this.showSubscribersDropdown = false; // Close the dropdown after selecting a subscriber
  }
}
