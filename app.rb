require 'sinatra'
require 'json'

class Rofl < Sinatra::Application

	# Set defaults
	configure do

	end

end

require_relative 'routes/init'
require_relative 'models/init'
require_relative 'helpers/init'
