class Rofl < Sinatra::Application
  require 'active_support/core_ext'
  require 'json'
  require 'mongo'
  require 'rest_client'
  include Mongo

  get '/lines' do
    # initialize a mongo database connection
    client = MongoClient.new("localhost", 27017)
    db = client.db('openforlines')
    coll = db.collection('lines')

    valid_leagues = ["NBA", "NCAA", "NFl"]
    #valid_sports = ["Basketball", "Football", "Basketball Props", "Football Props", "E Sports"]
    valid_sports = ["Basketball", "Football"] #, "Basketball Props", "Football Props"]
    #return_data = {"Basketball" => {"NBA" => Array.new, "NCAA" => Array.new}, "Football" => {"NFL" => Array.new, "NCAA" => Array.new}}
    return_data = Array.new

    url = "http://xml.pinnaclesports.com/pinnacleFeed.aspx?"
    puts url
    logObj = {:name => "epm"}
    logObj[:call] = "EPM.getStreamMap(url='#{url}')"
    response = RestClient.get url
    #puts response
    return_object = {}
    hash = JSON.parse(Hash.from_xml(response).to_json)
    #puts hash
    data = hash["pinnacle_line_feed"]["events"]["event"]
    leagues = Array.new
    sports = Array.new
    league_less = 0
    sport_less = 0
    matches = 0
    non_matches = 0
    data.each{
      |event|
      #puts event

      # init searching
      if (event.has_key?("league"))
        if (!leagues.include?(event["league"]))
          leagues << event["league"]
          #valid_leagues["league"] << event
        end
        league_less = league_less + 1
      end
      if (event.has_key?("sporttype"))
        if (!sports.include?(event["sporttype"]))
          sports << event["sporttype"]
          #valid_sports["sporttype"] << event
        end
        sport_less = sport_less + 1
      end
      if (valid_leagues.include?(event["league"]) && (valid_sports.include?(event["sporttype"])))
        matches = matches + 1
        #return_data[event["sporttype"]][event["league"]] << event
        return_data << event
        #return_data[event["sporttype"]] << event
        #return_data[event["sporttype"]] << event
      else
        non_matches = non_matches + 1
      end
    }
    return_object["matches"] = matches
    return_object["non_matches"] = non_matches
    return_object["league_less"] = league_less
    return_object["sport_less"] = sport_less
    return_object["leagues"] = leagues
    return_object["sporttype"] = sports
    #return_data = { "valid_leagues" => valid_leagues, "valid_sports" => valid_sports}

    return_object["lines_data"] = return_data

   # <event_datetimeGMT>2013-11-15 19:30</event_datetimeGMT>
	#<gamenumber>335341365</gamenumber>
   # <sporttype>Basketball</sporttype>
	#<league>Euroleague</league>
   # <IsLive>No</IsLive>

    return return_object.to_json
  end


  get '/ping' do
    return pong
  end

end