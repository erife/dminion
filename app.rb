require 'rubygems'
require 'set'
require 'em-websocket'
require 'yajl'
require 'sinatra'
require 'thin'
require './models/character'

set :static => true
set :public_folder, File.expand_path(File.dirname(__FILE__) + '/public')

$channel = EM::Channel.new
$characters = {
  "santorini" => Character.new("santorini"),
  "zakiti" => Character.new("zakiti")
}

EventMachine.run do
  class App < Sinatra::Base


    get '/' do
      erb :index
    end

    get '/dm' do
      characters = Character.format_characters($characters)
      characters_display = characters.map do |character|
        erb :character_row, :locals => {:character => character}
      end
      erb :dm, :locals => {:characters => characters_display}
    end

    get '/character/:character_name' do
      character = $characters[params[:character_name]]
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
        if $characters.has_key?(event["character_name"])
          character = $characters[event["character_name"]]
          response = character.handle_event(event)
        else
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
