# frozen_string_literal: true

module Quotations
  class UpdateQuotation
    include Callable
    extend Dry::Initializer

    option :quotation, type: Types::Instance(Quotation)
    option :user, type: Types.Instance(User).optional, optional: true
    option :params

    def call
      parsed_params = normalize_params(params)
      raise DomainError, "Cannot modify quotation with status #{quotation.status}" unless quotation.can_modify?

      updates = {}
      updates[:amount] = parsed_params[:amount].to_f if parsed_params[:amount].present?
      updates[:description] = parsed_params[:description] if parsed_params.key?(:description)
      updates[:valid_until] = Time.zone.parse(parsed_params[:valid_until].to_s) if parsed_params[:valid_until].present?

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

    private

    def normalize_params(raw)
      p = raw.respond_to?(:to_unsafe_h) ? raw.to_unsafe_h : raw
      p.respond_to?(:with_indifferent_access) ? p.with_indifferent_access : p
    end
  end
end
