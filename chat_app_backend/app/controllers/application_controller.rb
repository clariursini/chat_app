class ApplicationController < ActionController::API
  before_action :authenticate_user!, except: [:login, :register, :validate]

  private

  def authenticate_user!
    token = request.headers['Authorization']
    if token.present?
      begin
        decoded_token = JWT.decode(token.split(' ').last, Rails.application.secrets.secret_key_base, true, algorithm: 'HS256')
        user_id = decoded_token[0]['user_id']
        @current_user = User.find_by(id: user_id)

        # If the user is not found, return an error
        unless @current_user
          render json: { error: 'Unauthorized: User not found' }, status: :unauthorized
        end
      rescue JWT::DecodeError
        render json: { error: 'Unauthorized: Invalid token' }, status: :unauthorized
      end
    else
      render json: { error: 'Unauthorized: Token missing' }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end
end
