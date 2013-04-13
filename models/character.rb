class Character
  attr_reader :health

  def self.format_characters(characters)
    characters.keys.sort.map {|character_name| characters[character_name].format_index}
  end

  def initialize(options)
    @name            = options["name"]
    @initiative  = options["initiative"]

    @max_health      = options["max_health"]
    @health          = options["health"]
    @role            = options["role"]
  end

  def process(adjustment)
    vector = adjustment.to_i
    @health += vector
  end

  def format_index
    format_show
  end

  def initiative()
    @initiative
  end

  def format_show
    {
      :name            => @name,
      :health          => @health,
      :initiative      => initiative,
      :max_health      => @max_health,
      :role            => @role
    }
  end

  def handle_event(event)
    case event["type"]
    when "health"
      response = handle_attr_change_health(event)
    end
    response || event
  end

  def handle_attr_change_health(event)
    @health += event["msg"].to_i
    @health
    {"character_name" => @name, "type" => "health", "msg" => @health}
  end
end
