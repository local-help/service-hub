class ApplicationService
  def self.call(...)
    new(...).call
  end

  private

  def success(attrs = {})
    ServiceResult.new(true, attrs)
  end

  def failure(error)
    ServiceResult.new(false, error: error)
  end
end

class ServiceResult
  attr_reader :error

  def initialize(success, attrs = {})
    @success = success
    @error = attrs[:error]
    attrs.each do |key, value|
      instance_variable_set("@#{key}", value)
      singleton_class.define_method(key) { instance_variable_get("@#{key}") } unless respond_to?(key)
    end
  end

  def success?
    @success
  end

  def failure?
    !@success
  end
end
