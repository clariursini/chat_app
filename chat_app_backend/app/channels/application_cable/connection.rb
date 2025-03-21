module ApplicationCable
  class Connection < ActionCable::Connection::Base
    def connect
      # Chequear el token en la conexión
      if current_user
        # Si hay un usuario continuar la conexión
        logger.add_tags "ActionCable", current_user.nickname
        Rails.logger.info "WebSocket connection established for user: #{current_user.nickname}"
      else
        Rails.logger.error "Unauthorized WebSocket connection attempt."
        reject_unauthorized_connection
      end
    end

    def current_user
      token = request.params[:token]
      if token.present?
        begin
          payload = JwtService.decode(token)
          Rails.logger.info "Payload: #{payload.inspect}"
          user = User.find_by(id: payload['user_id'])
          Rails.logger.info "User found: #{user.inspect}"
          user
        rescue JWT::DecodeError => e
          Rails.logger.error "JWT Decode Error: #{e.message}"
          nil
        end
      else
        Rails.logger.error "Token is missing in the WebSocket request."
        nil
      end
    end
  end
end
