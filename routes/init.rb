class Rofl < Sinatra::Application

	before do

	end


  	get "/" do
                redirect "/index.html"
        end
end

require_relative 'main'
