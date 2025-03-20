class ChannelsController < ApplicationController
  before_action :authenticate_user!

  def index
    # Channels where the current user is subscribed
    subscribed_channels = Channel.joins(:subscriptions)
                                  .where(subscriptions: { user_id: current_user.id })
                                  .map do |channel|
      channel.as_json.merge(subscriber_count: channel.subscriptions.count)
    end

    # Public channels where the current user is NOT subscribed
    remaining_public_channels = Channel.where(public: true)
                                       .where.not(id: subscribed_channels.map { |c| c['id'] })
                                       .map do |channel|
      channel.as_json.merge(subscriber_count: channel.subscriptions.count)
    end

    # Find all users the current user has direct messages with
    direct_chat_users = Message.where.not(direct_recipient_id: nil)
                               .where('user_id = :user_id OR direct_recipient_id = :user_id', user_id: current_user.id)
                               .pluck(:user_id, :direct_recipient_id)
                               .flatten
                               .uniq
                               .reject { |id| id == current_user.id }

    # Fetch user details (id, nickname) for the chat list
    direct_messages = User.where(id: direct_chat_users).select(:id, :nickname)

    render json: {
      subscribed_channels: subscribed_channels,
      remaining_public_channels: remaining_public_channels,
      direct_messages: direct_messages
    }
  end

  def create
    @channel = Channel.new(channel_params)

    if @channel.save
      render json: @channel.as_json.merge(subscriber_count: @channel.subscriptions.count), status: :created
    else
      render json: @channel.errors, status: :unprocessable_entity
    end
  end

  def show
    @channel = Channel.find(params[:id])
    is_subscribed = @channel.subscriptions.exists?(user_id: current_user.id)

    # Pagination parameters
    limit = params[:limit] || 10
    offset = params[:offset] || 0

    # Fetch paginated messages
    messages = @channel.messages
                       .order(created_at: :desc) # Fetch the most recent messages first
                       .limit(limit)
                       .offset(offset)

    render json: {
      channel: @channel.name,
      description: @channel.description,
      messages: messages.map { |message| message.as_json.merge(user: message.user.nickname) },
      subscribers: @channel.subscriptions.map { |subscription| subscription.user.as_json(only: [:id, :nickname]) },
      is_subscribed: is_subscribed
    }
  end

  def subscribe
    @channel = Channel.find(params[:id])

    # Check if the user is already subscribed
    if @channel.subscriptions.exists?(user_id: current_user.id)
      render json: {
        error: 'You are already subscribed to this channel.',
        subscribers: @channel.subscriptions.map { |subscription| subscription.user.as_json(only: [:id, :nickname]) }
      }, status: :unprocessable_entity
      return
    end

    # Create a new subscription
    subscription = @channel.subscriptions.create(user: current_user)

    if subscription.persisted?
      render json: {
        message: 'Successfully subscribed to the channel.',
        channel: @channel.name,
        subscribers: @channel.subscriptions.map { |subscription| subscription.user.as_json(only: [:id, :nickname]) }
      }, status: :ok
    else
      render json: {
        error: 'Failed to subscribe to the channel.',
        subscribers: @channel.subscriptions.map { |subscription| subscription.user.as_json(only: [:id, :nickname]) }
      }, status: :unprocessable_entity
    end
  end

  def unsubscribe
    @channel = Channel.find(params[:id])

    # Find the subscription of the current user to the channel
    subscription = @channel.subscriptions.find_by(user_id: current_user.id)

    if subscription
      subscription.destroy
      render json: {
        message: 'Successfully unsubscribed from the channel.',
        channel: @channel.name,
        subscribers: @channel.subscriptions.map { |subscription| subscription.user.as_json(only: [:id, :nickname]) }
      }, status: :ok
    else
      render json: {
        error: 'You are not subscribed to this channel.',
        subscribers: @channel.subscriptions.map { |subscription| subscription.user.as_json(only: [:id, :nickname]) }
      }, status: :unprocessable_entity
    end
  end

  private

  def channel_params
    params.require(:channel).permit(:name, :public, :description)
  end
end
