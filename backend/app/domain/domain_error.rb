# frozen_string_literal: true

class DomainError < StandardError
  attr_reader :details

  def initialize(message, details: nil)
    @details = details
    super(message)
  end
end

