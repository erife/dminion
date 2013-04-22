require 'rubygems'
require 'yajl'
require 'sqlite3'

db = SQLite3::Database.new( "data.db" )

fields = %w(
 name
 level
 hp_current
 hp_temp
 role
 race
 str
 con
 dex
 int
 wis
 cha
 action_points
)
statements = [
  '''drop table character ''',
  "create table character (#{fields.join(', ')})",
]

Dir.glob("stubs/char_*.json") do |filename|
  character_file = File.open(filename).read
  character = Yajl::Parser.parse(character_file)
  keys = character.keys.join(", ")
  values = character.keys.map{|key| "'#{character[key]}'"}.join(", ")

  statement = <<-EOF
  insert into character (#{keys}) values (#{values})
EOF
  puts "PDS >> statement: #{statement.inspect} #{__FILE__} #{__LINE__}"
  statements << statement
end



statements.each do |statement|
  db.execute statement
end

db.close
