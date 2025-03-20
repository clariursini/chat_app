class MessagesController < ApplicationController
  before_action :authenticate_user!

  # CCrear un nuevo mensaje
  def create
    @message = Message.new(message_params)

    # Mensajes de un canal
    if params[:channel_id].present?
      @channel = Channel.find(params[:channel_id])
      @message.channel = @channel
    end

    # Mensajes directos
    if params[:direct_recipient_id].present?
      @direct_recipient = User.find(params[:direct_recipient_id])
      @message.direct_recipient = @direct_recipient
    end

    @message.user = current_user

    if @message.save
      render json: @message, status: :created
    else
      render json: @message.errors, status: :unprocessable_entity
    end
  end

  def direct_messages
    recipient = User.find(params[:id])

    # Chequear que el usuario no pueda chatear con si mismo
    return render json: { error: 'Cannot chat with yourself' }, status: :unprocessable_entity if recipient == current_user

    # Pagination
    limit = params[:limit] || 10
    offset = params[:offset] || 0

    # Fetch los chats directos entre el usuario actual y el destinatario
    messages = Message.where(
      '(user_id = :current_user AND direct_recipient_id = :recipient) OR
       (user_id = :recipient AND direct_recipient_id = :current_user)',
      current_user: current_user.id,
      recipient: recipient.id
    ).order(created_at: :desc)
     .limit(limit)
     .offset(offset)

    render json: {
      chat_with: { id: recipient.id, nickname: recipient.nickname },
      messages: messages.map do |message|
        {
          id: message.id,
          content: message.content,
          sender_id: message.user.id,
          sender_nickname: message.user.nickname,
          timestamp: message.created_at
        }
      end,
      stream_name: private_chat_stream(current_user.id, recipient.id)
    }
  end

  private

  def message_params
    params.require(:message).permit(:content, :user_id, :channel_id, :direct_recipient_id)
  end

  def private_chat_stream(user1_id, user2_id)
    # Convertir los IDs en un string para que sea único
    "direct_chat_#{[user1_id.to_i, user2_id.to_i].sort.join('_')}"
  end
end
