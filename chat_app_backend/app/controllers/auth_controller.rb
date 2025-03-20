class AuthController < ApplicationController

  # Registro de usuario
  def register
    # Verificamos si el correo ya está registrado
    user = User.find_by(email: params[:email])
    if user
      return render json: { error: 'El correo electrónico ya está registrado' }, status: :unprocessable_entity
    end

    # Si no esta registrado, creamos el nuevo usuario
    user = User.new(user_params)
    user.validated = false  # Inicialmente no está validado
    if user.save
      # Generamos el enlace de validación con el ID del usuario
      validation_link = "http://localhost:3000/validate/#{user.id}"
      # Devolvemos el enlace en la respuesta de la API
      render json: { message: 'Usuario registrado con éxito. Usa el enlace de validación para validar tu cuenta.',
                      validation_link: validation_link }, status: :created
    else
      render json: { error: 'Hubo un error al registrar el usuario' }, status: :unprocessable_entity
    end
  end

  # Validación de usuario
  def validate
    user = User.find_by(id: params[:id])

    if user
      if user.validated == false
        user.update_column(:validated, true)
        render json: { message: 'Cuenta validada exitosamente.' }, status: :ok
      else
        render json: { error: 'La cuenta ya se encuentra validada.' }, status: :unprocessable_entity
      end
    else
      render json: { error: 'El usuario no existe, por favor registrese.' }, status: :not_found
    end
  end

  def login
    user = User.authenticate(params[:email], params[:password])

    if user
      # Check if the user is validated
      if user.validated
        # Generate a JWT if the user is validated
        token = JwtService.encode(user_id: user.id)
        render json: { token: token, expiration: 24.hours.from_now, nickname: user.nickname }, status: :ok
      else
        render json: { error: 'El usuario no ha sido validado, por favor valide su cuenta para iniciar sesión.' }, status: :unauthorized
      end
    else
      render json: { error: 'Credenciales incorrectas. Por favor, revisa tu correo y contraseña.' }, status: :unauthorized
    end
  end

  private

  def user_params
    params.permit(:email, :password, :nickname)
  end
end
