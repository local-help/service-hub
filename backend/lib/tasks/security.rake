# frozen_string_literal: true

namespace :security do
  desc 'Run Brakeman security static analysis'
  task :brakeman do
    sh 'bundle exec brakeman -c config/brakeman.yml'
  end
end
