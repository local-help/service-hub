# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Command do
  # Define test commands
  let(:test_command_class) do
    Class.new do
      include Command

      option :name, type: Types::String
      option :multiplier, default: -> { 2 }

      def run
        Success("Hello, #{name * multiplier}!")
      end
    end
  end

  let(:failing_command_class) do
    Class.new do
      include Command

      option :reason, default: -> { :invalid_input }

      def run
        Failure(reason)
      end
    end
  end

  let(:exception_command_class) do
    Class.new do
      include Command

      def run
        Failure(ArgumentError.new('Invalid argument encountered'))
      end
    end
  end

  describe '.run' do
    it 'instantiates and executes the command returning Dry::Monads::Result::Success' do
      result = test_command_class.run(name: 'LocalHelp')
      expect(result).to be_a(Dry::Monads::Result::Success)
      expect(result.value!).to eq('Hello, LocalHelpLocalHelp!')
    end

    it 'returns Dry::Monads::Result::Failure on failure' do
      result = failing_command_class.run(reason: :booking_not_found)
      expect(result).to be_a(Dry::Monads::Result::Failure)
      expect(result.failure).to eq(:booking_not_found)
    end
  end

  describe '.run!' do
    it 'unwraps and returns the success value directly' do
      value = test_command_class.run!(name: 'LOCAL')
      expect(value).to eq('Hello, LOCALLOCAL!')
    end

    it 'raises CommandFailure when command fails with a non-exception payload' do
      payload = { error: 'Service unavailable' }
      expect {
        failing_command_class.run!(reason: payload)
      }.to raise_error(CommandFailure) do |err|
        expect(err.message).to eq(payload.inspect)
      end
    end

    it 're-raises the original exception when failure wraps an Exception' do
      expect {
        exception_command_class.run!
      }.to raise_error(ArgumentError, 'Invalid argument encountered')
    end
  end

  describe 'instance-level execution' do
    it 'allows manual instantiation and calling #run' do
      cmd = test_command_class.new(name: 'Antigravity')
      result = cmd.run
      expect(result).to be_success
      expect(result.value!).to eq('Hello, AntigravityAntigravity!')
    end
  end

  describe 'concrete command with User option' do
    let(:sample_command_class) do
      Class.new do
        include Command

        option :user, type: Types.Instance(User)

        def run
          Success(user.name.upcase)
        end
      end
    end

    let(:user) { create(:user, name: 'Rahul Sharma') }

    it 'returns result via .run' do
      result = sample_command_class.run(user: user)
      expect(result).to be_success
      expect(result.value!).to eq('RAHUL SHARMA')
    end

    it 'returns value directly via .run!' do
      value = sample_command_class.run!(user: user)
      expect(value).to eq('RAHUL SHARMA')
    end

    it 'supports instance-level execution command.run' do
      command = sample_command_class.new(user: user)
      result = command.run
      expect(result).to be_success
      expect(result.value!).to eq('RAHUL SHARMA')
    end
  end
end
