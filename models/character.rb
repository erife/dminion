class Character

  PASSIVE_MODIFIER = 10

  SKILL_MODS = {
    "acrobatics"    => "dex",
    "arcana"        => "int",
    "athletics"     => "str",
    "bluff"         => "cha",
    "diplomacy"     => "cha",
    "dungeoneering" => "wis",
    "endurance"     => "con",
    "heal"          => "wis",
    "history"       => "int",
    "insight"       => "wis",
    "intimidate"    => "cha",
    "nature"        => "wis",
    "perception"    => "wis",
    "religion"      => "int",
    "stealth"       => "dex",
    "streetwise"    => "cha",
    "thievery"      => "dex",
  }

  SKILL_RACE_MODS = {
    "acrobatics"    => %w(halfling),
    "arcana"        => %w(eladrin shardmind),
    "bluff"         => %w(tiefling),
    "diplomacy"     => %w(half-elf),
    "dungeoneering" => %w(dwarf),
    "endurance"     => %w(dwarf shardmind),
    "history"       => %w(dragonborn eladrin),
    "insight"       => %w(half-elf),
    "intimidate"    => %w(dragonborn),
    "nature"        => %w(elf),
    "perception"    => %w(elf),
    "stealth"       => %w(tiefling),
    "thievery"      => %w(halfling),
  }

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

    @hp_current = options["hp_current"].to_i
    @hp_temp    = options["hp_temp"].to_i
    @action_points = options["action_points"].to_i

    @skills = options["skills"].nil? ? [] : options["skills"].split(",")
    puts "PDS >> @skills: #{@skills.inspect} #{__FILE__} #{__LINE__}"

  end

  def process(adjustment)
    vector = adjustment.to_i
    @hp_current += vector
  end

  def format_index
    format_show
  end

  # CALCULATED TRAITS
  def level_modifier()
    @level / 2
  end

  def initiative()
    level_modifier + calc_stat_modifier(@stats["dex"])
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

    PASSIVE_MODIFIER + level_modifier + stat_modifier + race_modifier + role_modifier
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

    PASSIVE_MODIFIER + level_modifier + stat_modifier + race_modifier + role_modifier
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

    PASSIVE_MODIFIER + level_modifier + stat_modifier + race_modifier + role_modifier
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
    role_multiplier, role_modifier = Hash.new([0,0]).merge({
      "wizard" => [-1, -1],
      "fighter" => [1, 2],
      "paladin" => [1, 2],
    })[@role]

    final_multiplier = multiplier + role_multiplier
    final_modifier   =  modifier + role_modifier
    (@level * final_multiplier) + final_modifier + @stats["con"]
  end

  def surge_value()
    hp_total / 4
  end

  def calc_trained_modifier(skill)
    @skills.include?(skill) ? 5 : 0
  end

  def calc_skill_race_modifier(skill)
    SKILL_RACE_MODS[skill].include?(@race) ? 2 : 0
  end

  def calc_skill_modifier(skill)
    stat_name = SKILL_MODS[skill]

    stat_modifier = calc_stat_modifier(@stats[stat_name])
    trained_modifier = calc_trained_modifier(skill)
    race_modifier = calc_skill_race_modifier(skill)
    #TODO - add armor_modifier

    level_modifier + stat_modifier + trained_modifier + race_modifier
  end

  def get_skill(skill, passive = false)
    raise "Unknown skill" unless SKILL_MODS.keys.include?(skill)

    calc_skill_modifier(skill) + (passive ? PASSIVE_MODIFIER : 0)
  end

  def get_passive_skill(skill)
    passive = true
    get_skill(skill, passive)
  end

  # END CALCULATED TRAITS

  def calc_stat_modifier(stat)
    (stat - PASSIVE_MODIFIER)/2
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
      :p_perception  => get_passive_skill("perception"),
      :p_insight     => get_passive_skill("insight"),
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
