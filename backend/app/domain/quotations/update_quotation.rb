# frozen_string_literal: true

module Quotations
  class UpdateQuotation
    include Callable

    attr_reader :quotation, :user, :params

    def initialize(quotation:, user:, params:)
      @quotation = quotation.is_a?(Quotation) ? quotation : Quotation.find(quotation)
      @user = user
      @params = params.respond_to?(:to_unsafe_h) ? params.to_unsafe_h : params
      @params = @params.with_indifferent_access if @params.respond_to?(:with_indifferent_access)
    end

    def call
      raise DomainError, "Cannot modify quotation with status #{quotation.status}" unless quotation.can_modify?

      updates = {}
      updates[:amount] = params[:amount].to_f if params[:amount].present?
      updates[:description] = params[:description] if params.key?(:description)
      updates[:valid_until] = Time.zone.parse(params[:valid_until].to_s) if params[:valid_until].present?

      raise DomainError, 'Valid amount greater than 0 is required' if updates.key?(:amount) && updates[:amount] <= 0

      ActiveRecord::Base.transaction do
        quotation.update!(updates)

        if user&.admin_or_super_admin?
          AdminActivityLog.log!(
            admin: user,
            action: 'update_quotation',
            entity: quotation,
            metadata: { amount: quotation.amount.to_f }
          )
        end
      end

      quotation
    end
  end
end
