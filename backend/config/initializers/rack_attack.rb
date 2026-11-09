class Rack::Attack
  # Safelist localhost, internal docker bridges, and local Wi-Fi LAN networks (RFC 1918)
  safelist('allow from local and private networks') do |req|
    return false if ENV['ENABLE_STRICT_RATE_LIMITING'] == 'true'

    ip = req.ip
    ['127.0.0.1', '::1', 'localhost'].include?(ip) ||
      ip&.start_with?('172.', '192.168.', '10.')
  end

  # Throttle OTP requests: 30 per hour per phone
  throttle('otp/phone', limit: 30, period: 1.hour) do |req|
    req.params['phone'].presence if req.path == '/api/v1/auth/otp/send' && req.post?
  end

  # Throttle login attempts: 30 per 5 minutes per IP
  throttle('login/ip', limit: 30, period: 5.minutes) do |req|
    req.ip if req.path == '/api/v1/auth/login' && req.post?
  end

  # Throttle general API requests: 600 per 5 minutes per IP
  throttle('api/ip', limit: 600, period: 5.minutes) do |req|
    req.ip if req.path.start_with?('/api/')
  end

  # Custom throttle response
  self.throttled_responder = lambda do |_env|
    [429, { 'Content-Type' => 'application/json' },
     [{ error: 'Rate limit exceeded. Please try again later.' }.to_json]]
  end
end
