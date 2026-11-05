module Api
  module V1
    class UploadsController < ApplicationController
      skip_before_action :authenticate_user!, raise: false

      ALLOWED_EXTENSIONS = %w[.jpg .jpeg .png .webp .gif .pdf].freeze

      def create
        uploaded_file = params[:file]
        data_url = params[:data_url] || params[:image_data]

        uploads_dir = Rails.public_path.join('uploads')
        FileUtils.mkdir_p(uploads_dir)

        if uploaded_file.present?
          orig_name = File.basename(uploaded_file.original_filename.to_s)
          raw_ext = File.extname(orig_name).downcase
          ext = ALLOWED_EXTENSIONS.include?(raw_ext) ? raw_ext : '.jpg'
          filename = "#{Time.current.to_i}_#{SecureRandom.hex(6)}#{ext}"
          dest = uploads_dir.join(filename)

          File.binwrite(dest, uploaded_file.read)

          relative_url = "/uploads/#{filename}"
          full_url = "#{request.base_url}#{relative_url}"

          render json: {
            url: relative_url,
            full_url: full_url,
            file_url: relative_url,
            file_name: orig_name,
            content_type: uploaded_file.content_type || 'image/jpeg',
            file_size: File.size(dest)
          }, status: :created

        elsif data_url.present? && data_url.match(/\Adata:([^;]+);base64,(.+)\z/m)
          content_type = ::Regexp.last_match(1)
          base64_data = ::Regexp.last_match(2)
          ext = case content_type
                when 'image/png' then '.png'
                when 'image/webp' then '.webp'
                when 'image/gif' then '.gif'
                else '.jpg'
                end
          filename = "#{Time.current.to_i}_#{SecureRandom.hex(6)}#{ext}"
          dest = uploads_dir.join(filename)

          File.binwrite(dest, Base64.decode64(base64_data))

          relative_url = "/uploads/#{filename}"
          full_url = "#{request.base_url}#{relative_url}"

          render json: {
            url: relative_url,
            full_url: full_url,
            file_url: relative_url,
            file_name: "photo#{ext}",
            content_type: content_type,
            file_size: File.size(dest)
          }, status: :created

        else
          render json: { error: 'No file or image data provided' }, status: :unprocessable_entity
        end
      end

      private

      def skip_authorization?
        true
      end
    end
  end
end
