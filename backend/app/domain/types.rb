# frozen_string_literal: true

require 'dry-types'

module Types
  include Dry.Types()

  # Accepts an Active Record instance, or automatically resolves from an ID
  def self.Instance(klass)
    Constructor(klass) do |value|
      case value
      when klass then value
      when nil then nil
      when Integer, String
        record = klass.find_by(id: value)
        raise ActiveRecord::RecordNotFound, "Couldn't find #{klass} with 'id'=#{value}" unless record

        record
      else
        raise Dry::Types::ConstraintError.new(
          "#{value.inspect} violates constraints (type?(#{klass}, #{value.inspect}) failed)",
          value
        )
      end
    end
  end

  def self.Record(klass)
    Instance(klass)
  end
end
