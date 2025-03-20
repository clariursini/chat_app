declare module '@rails/actioncable' {
  export function createConsumer(url?: string): Cable;

  export interface Cable {
    subscriptions: Subscriptions;
  }

  export interface Subscriptions {
    create(channel: string | ChannelNameWithParams, mixin: Channel): Channel;
  }

  export interface ChannelNameWithParams {
    channel: string;
    [key: string]: any;
  }

  export interface Channel {
    received?(data: any): void;
    connected?(): void;
    disconnected?(): void;
    perform(action: string, data: any): void;
  }
}
