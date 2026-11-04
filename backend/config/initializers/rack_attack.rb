class Rack::Attack
  # Allow localhost in development and test environments
  safelist('allow from localhost') do |req|
    (req.ip == '127.0.0.1' || req.ip == '::1') if Rails.env.development? || Rails.env.test?
  end

  # Throttle OTP requests: 5 per hour per phone
  throttle('otp/phone', limit: 5, period: 1.hour) do |req|
    if req.path == '/api/v1/auth/otp/send' && req.post?
      req.params['phone'].presence
    end
  end

  # Throttle login attempts: 10 per 15 minutes per IP
  throttle('login/ip', limit: 10, period: 15.minutes) do |req|
    if req.path == '/api/v1/auth/login' && req.post?
      req.ip
    end
  end

  # Throttle general API requests: 300 per 5 minutes per IP
  throttle('api/ip', limit: 300, period: 5.minutes) do |req|
    if req.path.start_with?('/api/')
      req.ip
    end
  end

  # Custom throttle response
  self.throttled_responder = lambda do |_env|
    [429, { 'Content-Type' => 'application/json' },
     [{ error: 'Rate limit exceeded. Please try again later.' }.to_json]]
  end
end

