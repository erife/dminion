$(function(){
  var character_name = $("#character_name").val();

  ws = new WebSocket("ws://0.0.0.0:8080");

  ws.onmessage = function(evt) {
    var data = $.parseJSON(evt.data);
    if(data.character_name != character_name){
      return
    }

    if(data.type == "health"){
      handle_attr_change_health(data);
    } else if(data.type == "status"){
      handle_attr_change_status(data);
    }
    else {
      console.log(evt);
    }
  };



  ws.onclose = function() {
    ws.send("leaving");
  };

  ws.onopen = function() {
    ws.send(JSON.stringify({"type": "status", "character_name": character_name, "msg": "joining"}));
  };

  handle_attr_change_health = function(data) {
    $("#health ~ dd:first").html(data["msg"]).addClass("updated").effect("highlight", { times: 1 }, 1000).removeClass("updated");
  }

  handle_attr_change_status = function(data) {
  };

});
