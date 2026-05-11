Rails.application.routes.draw do
  # RSC E-commerce routes
  root 'home#index'

  get 'products', to: 'products#index'
  get 'product/:slug', to: 'products#show', as: :product

  get 'category/:slug', to: 'categories#show', as: :category

  get 'cart', to: 'cart#show'
  get 'checkout', to: 'checkout#show'

  get 'account', to: 'account#show'
  get 'account/orders', to: 'orders#index'
  get 'account/orders/:id', to: 'orders#show', as: :order
  get 'account/wishlist', to: 'wishlist#show'
  get 'account/addresses', to: 'addresses#index'

  get 'search', to: 'search#show'

  # Original demo routes
  get 'hello_server', to: 'hello_server#index'
  get 'hello_world', to: 'hello_world#index'

  # RSC payload route for React on Rails Pro
  rsc_payload_route

  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

  # PWA routes
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
end
