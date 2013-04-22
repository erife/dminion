var DMINION = (function(){
  var my = {},
  chosen_action = undefined;

  // utility functions
  var ws = new WebSocket("ws://" + host + ":8080");

  // Web socket event handling
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

  var pad = function(str, max) {
    return str.length < max ? pad("0" + str, max) : str;
  },

  playSound = function( url ){
    document.getElementById("sound").innerHTML="<embed src='"+url+"' hidden=true autostart=true loop=false>";
  },


  handle_attr_change_health = function(data) {
    var selector = "#" + data["character_name"] + " .health";
    $(selector).html(data["msg"]);
  },

  handle_attr_change_status = function(data) {
    var character_name = data["character_name"];
    if(data["msg"] == "joining"){
      $("#" + character_name + " td.status").addClass("connected").effect("pulsate", { times:1 }, 1000);

    } else if (data["msg"] == "leaving"){
      $("#" + character_name + " td.status").removeClass("connected");
    }

  },

  emit_event = function(type, character_name, msg){
    ws.send(JSON.stringify({"type": type, "character_name": character_name, "msg": msg}));
  },


  emit_status_event = function(character_name, msg){
    emit_event("status", character_name, msg);
  },

  emit_health_event = function(character_name, msg){
    emit_event("health", character_name, msg);
  },

  // UI

  // Action Log Panel
  handle_action_log = function(evt){
    var form = $(evt.target),
    input = form.children("input");

    emit_event("action_log", "dm", input.val());
    input.val("");
    input.blur();

    return false;

  },

  // Turn Management Panel
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

    clear_targets();

    next_character.focus();

  },

  // Resolution Panel

  heal_character = function(e){
    var target = $("#heal"),
    value = target.val(),
    current_targets = get_current_targets();

    if(value.length > 0 && current_targets.length){
      var character_name = current_character_name();

      $.map(current_targets, function(current_target){
        emit_health_event(current_target, value);
      })

      boilerplate = character_name + " heals " + targets_string(current_targets) + " for " + value + " health";
      auto_populate_action_log(boilerplate);

      // clear the input
      target.val("");
    }
    return false;
  },

  damage_character = function(e){
    var target = $("#damage"),
    value = target.val();

    if(value.length > 0){
      var character_name = current_character_name();
      var current_targets = get_current_targets();

      $.map(current_targets, function(current_target){
        emit_health_event(current_target, -1 * value);
        playSound("../sounds/arrow.wav");

      })

      boilerplate = character_name + " does " + value + " damage to " + targets_string(current_targets);
      auto_populate_action_log(boilerplate);

      // clear the input
      target.val("");
    }
    return false;
  },

  get_current_targets = function(){
    var targets = $("tr.target").map(function(){ return $(this).attr("id");}).get();
    return targets;
  },

  targets_string = function(targets){
    if(targets.length > 1){
      var display = targets.slice(0,-1).join(", ") + " and " + targets.slice(-1);
    } else{
      var display = targets[0];
    }
    return display;
  },

  handlekey = function(event){
    var k_del = 8,
    k_backspace = 46,
    k_spacebar = 32,
    k_ctrl = 17,
    k_1 = 49,
    k_9 = 57,
    k_0 = 48,
    k_n = 78,
    k_h = 72,
    k_d = 68;

    // Handle delete events to prevent back button from OSX
    if (event.which == k_del || event.which == k_backspace)
    {if(event.target.localName != "input") {return false;}}
    // Handle spacebar
    else if(event.which == k_spacebar){}
    // Esc
    else if(event.which == 27){}
    else if (event.ctrlKey){
      event.preventDefault();

      if(event.ctrlKey && event.which != k_ctrl){
        console.log(event.which);
        // Numbers 1-9 for selecting targets
        if(k_1 <= event.which && event.which <= k_9){
          var target_index = String.fromCharCode(event.which);
          toggle_target_by_index(target_index);
        }

        // clear all selected targets
        if(event.which == k_0){clear_targets();}

        // C-n for moving to the next turn
        if(event.which == k_n){next_character();}

        // C-d for applying damage
        if(event.which == k_h){$("#heal").focus();}

        // C-h for healing
        if(event.which == k_d){$("#damage").focus();}

      }
    }
    // alpha characters
    else if(event.which >=65 && event.which <=90){
    }
    // enter
    else if(event.which == 13){
    }
    // unhandled
    else{
    }
  },

  handle_expire_phase = function(evt){
    var target = $(evt.target),
    msg = target.siblings("span").attr("alt");

    // grey out the phase
    target.parents("li").addClass("expired");

    // prepopulate the action log with a message
    boilerplate = current_character_name() + " " + msg;
    auto_populate_action_log(boilerplate);
  },

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
    $('#party table .character')
      .sort(compare_rows)
      .appendTo('#party table')
      .map(function(i){
        var index = pad(new String(i+1), 2);

        $(this).addClass("creature_" + index);
      });


  },

  target_creature = function(evt){
    var creature = $(evt.target).parents("tr");
    creature.toggleClass("target");
  },

  toggle_target_by_index = function(index){
    var creature = $(".creature_" + pad(index, 2));
    creature.toggleClass("target");
  },

  clear_targets = function(){
    $("tr.target").removeClass("target");
  },

  current_character_name = function(){
    return $("tr.current_turn").attr("id");
  },

  auto_populate_action_log = function(msg) {
    $("#action_form input").val(msg + " ").focus();
  },

  handle_choose_action = function(evt) {
    current_action = $(evt.target).html();
    $(document).data("current_action", current_action);

    display_action_graphs();
  }

  display_action_graphs = function(){
    var current_action = $(document).data("current_action"),
    current_targets = get_current_targets();

    console.log(current_action);
    console.log(current_targets);

    if(!current_targets.length || !current_action){
      return
    }

    var children = $("#difficulty").children();
    if(children){
      children.remove();
    }

    var ac = {
      Toronaga: 21,
      Santorini: 23,
      Pook: 27,
      Zakiti: 20
    };

    var stats = [
      ["standard", 10],
      ["weapon", 2],
      ["skill", 1],
      ["feat", 2],
      ["aura", 2]
    ];


    $.map(current_targets, function(target){
      var difficulty = ac[target];

      var url = GRAPHS.generate_action_graph(current_action, target, difficulty, stats);
      console.log(url);

      var img = $("<img>",{src: url});

      $("<li>").html(img)
        .appendTo("#difficulty");

    })

    $("#damage").focus();
  };

  my.initialize = function(){
    next_character();
    // map event handlers
    $(".character input").blur(function(){next_character();})
    $("#phases img.phase").click(handle_expire_phase);
    $("#action_form").submit(handle_action_log);
    $("#apply_heal").submit(heal_character);
    $("#apply_damage").submit(damage_character);
    $(".character img.target").click(target_creature);
    $("#available li").click(handle_choose_action);

    $(document).keydown(handlekey);
  }
  return my;
}());

$(function(){
  DMINION.initialize();

})
