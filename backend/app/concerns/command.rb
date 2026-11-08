# frozen_string_literal: true

require 'dry/initializer'
require 'dry/monads'

module Command
  def self.included(base)
    base.extend(Dry::Initializer)
    base.include(Dry::Monads[:result])
    base.extend(ClassMethods)
    base.include(InstanceMethods)
  end

  module InstanceMethods
    def run
      if respond_to?(:call, true) && method(:call).owner != InstanceMethods
        call
      else
        raise NotImplementedError, "#{self.class.name} must implement #run or #call"
      end
    end

    def call(&block)
      run(&block)
    end
  end

  module ClassMethods
    def run(*args, **kwargs, &block)
      new(*args, **kwargs).run(&block)
    end

    def call(*args, **kwargs, &block)
      new(*args, **kwargs).run(&block)
    end

    def run!(*args, **kwargs, &block)
      result = run(*args, **kwargs, &block)

      result.either(
        ->(value) { value },
        ->(failure) {
          raise failure if failure.is_a?(Exception)

          raise CommandFailure, failure
        }
      )
    end

    def call!(*args, **kwargs, &block)
      run!(*args, **kwargs, &block)
    end
  end
end

