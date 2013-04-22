require 'rubygems'
require 'set'
require 'em-websocket'
require 'yajl'
require 'sqlite3'
require 'sinatra'
require 'thin'
require './models/character'
require './models/action_log'

set :static => true
set :public_folder, File.expand_path(File.dirname(__FILE__) + '/public')

$channel = EM::Channel.new

$db = SQLite3::Database.new( "data.db" )
$db.results_as_hash = true

EventMachine.run do
  class App < Sinatra::Base


    get '/' do
      erb :index
    end

    get '/dm' do
      character_data = {}
      stubs = $db.execute( "select * from characters" )

      stubs.each do |stub|
        character_data[stub["name"]] = Character.new(stub)
      end
      characters = Character.format_characters(character_data)
      characters_display = characters.map do |character|
        erb :character_row, :locals => {:character => character}
      end
      turn_display       = erb :turn
      action_display     = erb :action
      resolution_display = erb :resolution

      erb :dm, :locals => {
        :characters => characters_display,
        :turn       => turn_display,
        :action     => action_display,
        :resolution => resolution_display
      }
    end

    get '/character/:character_name' do
      # stm = $db.prepare( "select * from characters where name=?" )
      # stm.bind 1, params[:character_name]

      character = Character.new({})
      erb :character, :locals => character.format_show()
    end

    post '/' do
      $channel.push "POST>: #{params[:text]}"
    end
  end

  EventMachine::WebSocket.start(:host => '0.0.0.0', :port => 8080) do |ws|
    ws.onopen {
      sid = $channel.subscribe { |msg| ws.send msg }
      response = {
        "type" => "status",
        "msg" => "#{sid} connected!"
      }
      $channel.push Yajl::Encoder.encode(response)

      ws.onmessage { |msg|
        event = Yajl::Parser.parse(msg)
        if event["type"] == "health"
          character_name = event["character_name"]
          character_data = $db.execute("select * from characters where name=?", character_name)[0]
          if character_data
            character = Character.new(character_data)
            response = character.handle_event(event)
            $db.execute "update characters set health=? where name=?", response["msg"], character_name

            response
          end
        else
          if event["type"] == "action_log"
            ActionLog.handle(event)
          end
          response = event
        end

        $channel.push Yajl::Encoder.encode(response)
      }

      ws.onclose {
        $channel.unsubscribe(sid)
      }
    }

  end

  App.run!({:port => 3000})
end
