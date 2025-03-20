import { Injectable } from '@angular/core';
import * as ActionCable from '@rails/actioncable';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private cable: ActionCable.Cable;
  private subscriptions: { [key: string]: ActionCable.Channel } = {};
  private currentUserId: string;

  constructor(private authService: AuthService) {
    // Obtener el token de autenticación
    const token = this.authService.getToken();
    this.currentUserId = this.authService.getCurrentUser()?.id?.toString() || ''; // Convert to string or use a default value
    console.log("Current user ID:", this.currentUserId);

    // Conectar a ActionCable en /cable con el token como parámetro
    this.cable = ActionCable.createConsumer(`ws://localhost:3000/cable?token=${token}`);
  }

  // Suscribirse a un canal
  joinChannel(channelId: string, onMessageReceived: (data: any) => void): void {
    const identifier = JSON.stringify({ channel: 'ChatChannel', channel_id: channelId });

    if (!this.subscriptions[identifier]) {
      console.log("Creating subscription for channel:", channelId);
      this.subscriptions[identifier] = this.cable.subscriptions.create(
        { channel: 'ChatChannel', channel_id: channelId },
        {
          received: (data) => {
            console.log("Message received from backend:", data);
            onMessageReceived(data); // Call the callback when a message is received
          },
          connected: () => {
            console.log(`Connected to channel: ${channelId}`);
          },
          disconnected: () => {
            console.log(`Disconnected from channel: ${channelId}`);
          },
        } as ActionCable.Channel // Type assertion to satisfy TypeScript
      );
    } else {
      console.log("Subscription already exists for channel:", channelId);
      const existingSubscription = this.subscriptions[identifier];
      console.log("Reusing existing subscription:", existingSubscription);
    }
  }

  // joinDirectChat(recipientId: string, onMessageReceived: (data: any) => void): void {
  //   // Ensure both currentUserId and recipientId are defined and not empty
  //   if (!this.currentUserId || !recipientId) {
  //     console.error('Missing user ID or recipient ID');
  //     return;
  //   }

  //   const streamName = `direct_chat_${[this.currentUserId, recipientId].sort().join('_')}`;
  //   console.log("Stream name:", streamName);
  //   const identifier = JSON.stringify({ channel: 'ChatChannel', recipient_id: recipientId });

  //   if (!this.subscriptions[identifier]) {
  //     console.log(`Subscribing to private chat channel: ${streamName}`);
  //     this.subscriptions[identifier] = this.cable.subscriptions.create(
  //       { channel: 'ChatChannel', recipient_id: recipientId },
  //       {
  //         received: (data) => {
  //           console.log('Message received in private chat:', data);
  //           onMessageReceived(data);
  //         },
  //         connected: () => {
  //           console.log(`Connected to private chat channel: ${streamName}`);
  //         },
  //         disconnected: () => {
  //           console.log(`Disconnected from private chat channel: ${streamName}`);
  //         },
  //       } as ActionCable.Channel
  //     );
  //   } else {
  //     console.log(`Already subscribed to private chat channel: ${streamName}`);
  //   }
  // }


  joinDirectChat(recipientId: string, onMessageReceived: (data: any) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.currentUserId || !recipientId) {
        console.error('Missing user ID or recipient ID');
        reject('Missing user ID or recipient ID');
        return;
      }

      const streamName = `direct_chat_${[this.currentUserId, recipientId].sort().join('_')}`;
      console.log("Stream name:", streamName);
      const identifier = JSON.stringify({ channel: 'ChatChannel', recipient_id: recipientId });

      if (!this.subscriptions[identifier]) {
        console.log(`Subscribing to private chat channel: ${streamName}`);
        this.subscriptions[identifier] = this.cable.subscriptions.create(
          { channel: 'ChatChannel', recipient_id: recipientId },
          {
            received: (data) => {
              console.log('Message received in private chat:', data);
              onMessageReceived(data);
            },
            connected: () => {
              console.log(`Connected to private chat channel: ${streamName}`);
              resolve(); // Resolvemos la Promise cuando la conexión está lista
            },
            disconnected: () => {
              console.log(`Disconnected from private chat channel: ${streamName}`);
            },
          } as ActionCable.Channel
        );
      } else {
        console.log(`Already subscribed to private chat channel: ${streamName}`);
        resolve(); // Ya estaba suscrito, así que resolvemos directamente
      }
    });
  }


  // Enviar un mensaje al canal
  sendMessage(channelId: string, message: string): void {
    const identifier = JSON.stringify({ channel: 'ChatChannel', channel_id: channelId });
    console.log("subscriptions:", this.subscriptions[identifier]);

    if (this.subscriptions[identifier]) {
      console.log("Sending message:", message);
      console.log("subscription:", this.subscriptions[identifier]);
      this.subscriptions[identifier].perform('send_message', { content: message, channel_id: channelId});
    } else {
      console.error('No subscription found for channel:', channelId);
    }
  }

  // Enviar mensajes directos
  // sendDirectMessage(recipientId: string, message: string): void {
  //   const identifier = JSON.stringify({ channel: 'ChatChannel', recipient_id: recipientId });
  //   console.log("Sending direct message:", message);

  //   if (this.subscriptions[identifier]) {
  //     this.subscriptions[identifier].perform('send_message', { content: message, recipient_id: recipientId });
  //   } else {
  //     console.error('No subscription found for direct chat with recipient:', recipientId);
  //   }
  // }

  sendDirectMessage(recipientId: string, message: string): void {
    const identifier = JSON.stringify({ channel: 'ChatChannel', recipient_id: recipientId });

    if (this.subscriptions[identifier]) {
      this.subscriptions[identifier].perform('send_message', { content: message, recipient_id: recipientId });
    } else {
      console.warn(`No subscription found for direct chat with recipient: ${recipientId}, trying to subscribe first...`);

      this.joinDirectChat(recipientId, () => {}).then(() => {
        console.log("Now connected, sending message...");
        this.subscriptions[identifier].perform('send_message', { content: message, recipient_id: recipientId });
      }).catch(err => console.error("Failed to subscribe before sending message:", err));
    }
  }

}
