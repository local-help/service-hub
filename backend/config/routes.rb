Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # Health check
      get 'health', to: 'health#show'

      # Authentication
      post 'auth/register', to: 'auth#register'
      post 'auth/login', to: 'auth#login'
      post 'auth/otp/send', to: 'auth#send_otp'
      post 'auth/otp/verify', to: 'auth#verify_otp'
      post 'auth/refresh', to: 'auth#refresh'
      delete 'auth/logout', to: 'auth#logout'
      get 'auth/me', to: 'auth#me'
      patch 'auth/profile', to: 'auth#update_profile'
      post 'auth/password/reset', to: 'auth#reset_password'
      patch 'auth/password', to: 'auth#change_password'

      # Public
      resources :categories, only: [:index, :show]
      resources :services, only: [:index, :show]
      get 'platform/support_info', to: 'platform#support_info'

      # Customer
      resources :addresses, except: [:new, :edit]
      resources :service_requests, only: [:index, :show, :create] do
        post :cancel, on: :member
        resource :quotation, only: [:show] do
          post :approve
          post :reject
        end
      end
      resources :bookings, only: [:index, :show] do
        post :reschedule, on: :member
        post :cancel, on: :member
        post :feedback, on: :member
        resources :payments, only: [:index] do
          collection do
            post :initiate
            post :verify
          end
        end
      end
      resources :notifications, only: [:index] do
        patch :read, on: :member
        post :read_all, on: :collection
      end
      resources :devices, only: [:create, :destroy]

      # Admin
      namespace :admin do
        get 'dashboard', to: 'dashboard#show'

        resources :service_requests, only: [:index, :show, :update] do
          post :assign_provider, on: :member
          resources :communications, only: [:index, :create]
        end
        resources :providers, only: [:index, :show, :create, :update]
        resources :quotations, only: [:update] do
          collection do
            post ':service_request_id', to: 'quotations#create', as: :create_for_request
          end
        end
        resources :bookings, only: [:index, :show, :update] do
          post :reschedule, on: :member
          post :cancel, on: :member
        end
        resources :customers, only: [:index, :show]
        resources :payments, only: [:index] do
          post :record_offline, on: :collection
        end
        resources :activity_logs, only: [:index]

        # Super Admin
        resources :users, only: [:index, :update] do
          post :invite, on: :collection
        end
        resources :categories, only: [:create, :update]
        resources :services, only: [:create, :update]
        resources :platform_settings, only: [:index, :update], param: :key
      end
    end
  end
end
