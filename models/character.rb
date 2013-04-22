class Character
  attr_reader :health

  def self.format_characters(characters)
    characters.keys.sort.map {|character_name| characters[character_name].format_index}
  end

  def initialize(options)
    @name       = options["name"]
    @role       = options["role"]
    @race       = options["race"]
    
    @level      = options["level"].to_i
    stats = %w(str con dex int wis cha)
    @stats = Hash[stats.map {|stat| [stat, options[stat].to_i]}]

    @hp_current = options["hp_current"]
    @hp_temp    = options["hp_temp"]
    @action_points = options["action_points"]
    
  end

  def process(adjustment)
    vector = adjustment.to_i
    @hp_current += vector
  end

  def format_index
    format_show
  end

  # CALCULATED TRAITS
  def initiative()
    @level/2 + calc_stat_modifier(@stats["dex"])
  end

  def speed()
    racial_speed = {
      "dragonborn" => 5,
      "human"      => 5,
      "dwarf"      => 5,
      "shardmind"  => 6,
      "elf"        => 6,
    }[@race]
  end

  def fort()
    strength = @stats["str"]
    constitution = @stats["con"]
    stat_modifier = calc_stat_modifier(strength > constitution ? strength : constitution)
    
    race_modifiers = {
      "human"      => 1,
    }
    race_modifier = race_modifiers.has_key?(@race) ? race_modifiers[@race] : 0
    
    role_modifiers = {
      "warrior" => 2,
      "paladin" => 1,
      "ranger"  => 1,
      "warlord" => 1,
    }
    role_modifier = role_modifiers.has_key?(@role) ? role_modifiers[@role] : 0
    
    10 + (@level/2) + stat_modifier + race_modifier + role_modifier
  end

  def reflex()
    dex = @stats["dex"]
    int = @stats["int"]
    stat_modifier = calc_stat_modifier(dex > int ? dex : int)
    
    race_modifiers = {
      "human"      => 1,
    }
    race_modifier = race_modifiers.has_key?(@race) ? race_modifiers[@race] : 0
    
    role_modifiers = {
      "rogue"   => 2,
      "paladin" => 1,
      "ranger"  => 1,
      "warlock" => 1,
    }
    role_modifier = role_modifiers.has_key?(@role) ? role_modifiers[@role] : 0
    
    10 + (@level/2) + stat_modifier + race_modifier + role_modifier
  end

  def will()
    wis = @stats["wis"]
    cha = @stats["cha"]
    stat_modifier = calc_stat_modifier(wis > cha ? wis : cha)
    
    race_modifiers = {
      "human"      => 1,
    }
    race_modifier = race_modifiers.has_key?(@race) ? race_modifiers[@race] : 0
    
    role_modifiers = {
      "wizard"  => 2,
      "cleric"  => 2,
      "paladin" => 1,
      "ranger"  => 1,
      "warlord" => 1,
      "warlock" => 1,
    }
    role_modifier = role_modifiers.has_key?(@role) ? role_modifiers[@role] : 0
    
    10 + (@level/2) + stat_modifier + race_modifier + role_modifier
  end
  
  def surge_total()
    base_surges = 6
    role_modifiers = {
      "warrior" => 3,
      "paladin" => 4,
      "warlord" => 1
    }
    role_modifier = role_modifiers.has_key?(@role) ? role_modifiers[@role] : 0
    base_surges + role_modifier + calc_stat_modifier(@stats["con"])
  end

  def hp_total()
    multiplier = 5
    modifier   = 7
    role_modifiers = {
      "wizard" => [-1, -1],
      "fighter" => [1, 2],
      "paladin" => [1, 2],
    }
    role_multiplier, role_modifier = role_modifiers.has_key?(@role) ? role_modifiers[@role] : [0, 0]
    final_multiplier = multiplier + role_multiplier
    final_modifier   =  modifier + role_modifier
    (@level * final_multiplier) + final_modifier + @stats["con"]
  end

  def surge_value()
    hp_total / 4
  end
  # END CALCULATED TRAITS
  
  def calc_stat_modifier(stat)
    (stat - 10)/2
  end

  def format_show
    {
      :name          => @name,
      :level         => @level,
      :hp_current    => @hp_current,
      :initiative    => initiative,
      :role          => @role,
      :race          => @race,
      :hp_total      => hp_total,
      :hp_current    => @hp_current,
      :hp_temp       => @hp_temp,
      :surge_total   => surge_total,
      :surge_current => 1,
      :surge_value   => surge_value,
      :action_points => @action_points,
      :ac            => 1, #TODO - calculate from player's handbook
      :fort          => fort,
      :reflex        => reflex,
      :will          => will,
      :str           => @stats["str"],
      :con           => @stats["con"],
      :dex           => @stats["dex"],
      :int           => @stats["int"],
      :wis           => @stats["wis"],
      :cha           => @stats["cha"],
      :speed         => speed,
      :p_perception  => 1, #TODO - calculate from player's handbook
      :p_insight     => 1, #TODO - calculate from player's handbook
    }
  end

  def handle_event(event)
    case event["type"]
    when "health"
      response = handle_attr_change_hp_current(event)
    end
    response || event
  end

  def handle_attr_change_hp_current(event)
    @hp_current += event["msg"].to_i
    @hp_current
    {"character_name" => @name, "type" => "health", "msg" => @hp_current}
  end
end
