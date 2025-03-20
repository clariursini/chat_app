Rails.application.routes.draw do
  post 'register', to: 'auth#register'  # Registro de usuario
  get 'validate/:id', to: 'auth#validate'  # Validación de usuario
  post 'login', to: 'auth#login'  # Inicio de sesión

  # WebSocket channel routes
  mount ActionCable.server => '/cable'

  # API routes
  resources :channels, only: [:index, :create, :show] do
    member do
      post :subscribe
      delete :unsubscribe
    end
    resources :messages, only: [:create]
  end

  # Users
  resources :users, only: [:index]

  # Direct messages (not tied to a channel)
  resources :messages, only: [:create]
  get 'direct_messages/:id', to: 'messages#direct_messages'
end
