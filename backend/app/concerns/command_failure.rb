# frozen_string_literal: true

class CommandFailure < StandardError
  attr_reader :failure

  def initialize(failure = nil)
    @failure = failure
    msg = failure.is_a?(String) ? failure : failure.inspect
    super(msg)
  end
end

