$(function(){
  ws = new WebSocket("ws://0.0.0.0:8080");

  ws.onmessage = function(evt) {
    var data = $.parseJSON(evt.data);

    if(data.type == "health"){
      handle_attr_change_health(data)
    } else if(data.type == "status"){
      handle_attr_change_status(data);
    }
    else {
      console.log(evt);
    }
  };

  ws.onclose = function() {
    emit_status_event("leaving");
  };

  ws.onopen = function() {
    emit_status_event("joining");
  };

  handle_attr_change_health = function(data) {
    var selector = "#" + data["character_name"] + " .health";
    $(selector).html(data["msg"]);
  };

  handle_attr_change_status = function(data) {
    var character_name = data["character_name"];
    if(data["msg"] == "joining"){
      $("#" + character_name + " td.status").addClass("connected").effect("pulsate", { times:1 }, 1000);

    } else if (data["msg"] == "leaving"){
      $("#" + character_name + " td.status").removeClass("connected");
    }

  };

  emit_event = function(type, character_name, msg){
    ws.send(JSON.stringify({"type": type, "character_name": character_name, "msg": msg}));
  }

  emit_status_event = function(character_name, msg){
    emit_event("status", character_name, msg);
  }

  emit_health_event = function(character_name, msg){
    emit_event("health", character_name, msg);
  }

  next_character = function(){
    var current_character = $("tr.current_turn"),
    next_character = current_character.next();
    if(next_character.length < 1){
      next_character = $("tr.character:first");
    }

    current_character.removeClass("current_turn");
    next_character.addClass("current_turn");

    next_character.find("input").focus();

  }

  $("input[name=health_adjustment]").change(function(e) {
    var target = $(e.target),
    value = target.val();

    if(value.length > 0){
      var character_name = target.parents("tr").attr("id");

      emit_health_event(character_name, value);
      target.val();
    }
    return false;
  });

  initialize = function(){
    next_character();
    $(".character input").blur(function(){next_character();})
  }

  initialize();

});
