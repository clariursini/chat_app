class UsersController < ApplicationController
  before_action :authenticate_user!

  # GET /users
  def index
    users = User.where.not(id: current_user.id).select(:id, :nickname)
    render json: users, status: :ok
  rescue
    render json: { error: 'Failed to fetch users' }, status: :internal_server_error
  end
end
