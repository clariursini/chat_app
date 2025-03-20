class ChatChannel < ApplicationCable::Channel
  def subscribed
    puts "params"
    puts params
    if params[:channel_id].present?
      # Public channel subscription
      stream_from "chat_#{params[:channel_id]}_channel"
    elsif params[:recipient_id].present?
      # Private direct message subscription
      stream_from private_chat_stream(connection.current_user.id, params[:recipient_id])
    else
      reject
    end
  end

  def unsubscribed
  end

  def send_message(data)
    if data['channel_id'].present?
      # Public message
      message = Message.create!(
        content: data['content'],
        user: connection.current_user,
        channel_id: data['channel_id']
      )

      ActionCable.server.broadcast(
        "chat_#{data['channel_id']}_channel",
        {
          message: message.content,
          user: message.user.nickname,
          user_id: message.user.id,
          timestamp: message.created_at
        }
      )
    elsif data['recipient_id'].present?
      # Private direct message
      message = Message.create!(
        content: data['content'],
        user: connection.current_user,
        direct_recipient_id: data['recipient_id']
      )

      # Broadcast to both users involved in the private chat
      ActionCable.server.broadcast(
        private_chat_stream(connection.current_user.id, data['recipient_id']),
        {
          message: message.content,
          sender: message.user.nickname,
          sender_id: message.user.id,
          recipient_id: data['recipient_id'],
          timestamp: message.created_at
        }
      )
    end
  end

  private

  def private_chat_stream(user1_id, user2_id)
    # Convertir los IDs en un string para que sea único
    "direct_chat_#{[user1_id.to_i, user2_id.to_i].sort.join('_')}"
  end
end
