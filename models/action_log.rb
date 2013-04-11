class ActionLog
  def self.handle(event)
    if event["character_name"] == "dm"
      log = File.open("logs/action_log.log", "a")
      log.write(event["msg"] + "\n")
      log.close()
    end
    event
  end
end
