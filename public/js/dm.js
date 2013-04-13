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
    handle_initiative_change();
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

  function heal_character(e){
    var target = $(e.target),
    value = target.val();

    if(value.length > 0){
      var character_name = current_character_name();
      var current_targets = get_current_targets();

      $.map(current_targets, function(current_target){
        emit_health_event(current_target, value);
      })

      boilerplate = character_name + " heals " + targets_string(current_targets) + " for " + value + " health";
      auto_populate_action_log(boilerplate);

      // clear the input
      target.val("");
    }
    return false;
  }

  function damage_character(e){
    var target = $(e.target),
    value = target.val();

    if(value.length > 0){
      var character_name = current_character_name();
      var current_targets = get_current_targets();

      $.map(current_targets, function(current_target){
        emit_health_event(current_target, -1 * value);
      })

      boilerplate = character_name + " damages " + targets_string(current_targets) + " for " + value + " health";
      auto_populate_action_log(boilerplate);

      // clear the input
      target.val("");
    }
    return false;
  }



  function get_current_targets(){
    var targets = $("tr.target").map(function(){ return $(this).attr("id");}).get();
    return targets;
  }

  function targets_string(targets){
    if(targets.length > 1){
      var display = targets.slice(0,-1).join(", ") + " and " + targets.slice(-1);
    } else{
      var display = targets[0];
    }
    return display;
  }

  $("#resolution input[name=heal]").blur(heal_character);
  $("#resolution input[name=damage]").blur(damage_character);

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

   handle_initiative_change = function(evt) {
    // a simple compare function, used by the sort below
     var compare_rows = function (a,b){
       var a_val = parseInt($(a).children(".initiative").html());
       var b_val = parseInt($(b).children(".initiative").html());

       if (a_val>b_val){
        return -1;
      }
      if (a_val<b_val){
        return 1;
      }
      return 0;
    };

    // the actual sort
    $('#party table .character').sort(compare_rows).appendTo('#party table');

  };

  handle_action_log = function(evt){
    var form = $(evt.target),
    input = form.children("input");

    emit_event("action_log", "dm", input.val());
    input.val("");
    input.blur();

    return false;

  }

  target_creature = function(evt){
    var creature = $(evt.target).parents("tr");
    creature.toggleClass("target");
  }

  current_character_name = function(){
    return $("tr.current_turn").attr("id");
  }

  auto_populate_action_log = function(msg) {
    $("#action_form input").val(msg + " ").focus();
  }

  $("#action img.phase").click(handle_expire_phase);
  $("#action_form").submit(handle_action_log);

  $(".character img.target").click(target_creature);

  $(document).keydown(handlekey);


  initialize();

});
