require 'rubygems'
require 'yajl'
require 'sqlite3'

db = SQLite3::Database.new( "data.db" )

statements = [
  '''drop table characters ''',
  '''create table characters (name, health, max_health, initiative, role) ''',
  '''insert into characters (name, health, max_health, initiative, role) values ("Zakiki", 56, 60, 2, "mage")''',
  '''insert into characters (name, health, max_health, initiative, role) values ("Santorini", 65, 68, 12, "ranger")''',
  '''insert into characters (name, health, max_health, initiative, role) values ("Pook", 45, 45, 28, "rogue")''',
  '''insert into characters (name, health, max_health, initiative, role) values ("Toronaga", 87, 87, 23, "warrior")'''
]

statements.each do |statement|
  db.execute statement
end
db.close
