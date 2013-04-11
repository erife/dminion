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

    // Re-enable the phases
    $("#action li").removeClass("expired");

    next_character.focus();

  }

  $("input[name=health_adjustment]").change(function(e) {
    var target = $(e.target),
    value = target.val();

    if(value.length > 0){
      var character_name = current_character_name();

      emit_health_event(character_name, value);

      if(value > 0){
        boilerplate = character_name + " is healed for " + value + " health";
      } else {
        boilerplate = character_name + " takes " + value + " damage";
      }

      auto_populate_action_log(boilerplate);

      // clear the input
      target.val();
    }
    return false;
  });

  initialize = function(){
    next_character();
    $(".character input").blur(function(){next_character();})
  }

  function handlekey(event){

    // Handle delete events to prevent back button from OSX
    if (event.which == 8 || event.which == 46)
    {
        if(event.target.localName != "input") {
	        return false;
        }
    }
    // Handle spacebar
    else if(event.which == 32){

    }
    // Esc
    else if(event.which == 27){
    }
    // alpha characters
    else if(event.which >=65 && event.which <=90){
      if(event.which == 78){
        if(event.target.localName != "input") {

          next_character();
        }
      }

    }
    // enter
    else if(event.which == 13){
    }
    // unhandled
    else{

    }
  }

  handle_expire_phase = function(evt){
    var target = $(evt.target),
    msg = target.siblings("span").attr("alt");

    // grey out the phase
    target.parents("li").addClass("expired");

    // prepopulate the action log with a message
    boilerplate = current_character_name() + " " + msg;
    auto_populate_action_log(boilerplate);
  }

  handle_action_log = function(evt){
    var form = $(evt.target),
    input = form.children("input");

    emit_event("action_log", "dm", input.val());
    input.val("");
    input.blur();

    return false;

  }

  current_character_name = function(){
    return $("tr.current_turn").attr("id");
  }

  auto_populate_action_log = function(msg) {
    $("#action_form input").val(msg).focus();
  }

  $("#action button").click(handle_expire_phase);
  $("#action_form").submit(handle_action_log);

  $(document).keydown(handlekey);


  initialize();

});
