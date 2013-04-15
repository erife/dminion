var GRAPHS = (function(){
  var app ={};
  var sum = function(my_array){
    var total = 0;
    $.map(my_array, function(num) {
        total += num;
    });
    return total;
  };

  app.generate_action_graph = function(chosen_action, target, difficulty, stats){


    var colors = [
      "603311",
      "8B4513",
      "8B5A2B",
      "8B7765",
      "8B8682",
      "CC7F32",
      "8B4500",
      "CC7722"
    ]
    var easy = "00AA00", // Green
    moderate = "4d89f9", // Dark Blue
    hard = "AA0000";     // Red

    var numeric_stats = stats.map(function(stat){return stat[1];}),
    modifiers = stats.map(function(stat){return stat[0];}),
    total_mod = sum(numeric_stats),
    die_roll = (difficulty > total_mod) ? difficulty - total_mod : undefined,
    die_roll_pos = stats.length;

    var mod_spectrum = $.makeArray($(colors).slice(0, die_roll_pos));

    if(die_roll){
      numeric_stats.push(die_roll);
      modifiers.push("lowest successful die roll");

      console.log(die_roll);

      if(die_roll < 9){
        difficulty_color = easy;
      } else if (die_roll < 15){
        difficulty_color = moderate;
      } else {
        difficulty_color = hard;
      }

      mod_spectrum.push(difficulty_color);
    }

    var stats_display = numeric_stats.join("|"),
    modifiers_display = modifiers.join("|");
    color_display = mod_spectrum.join(",");

    console.log(color_display);


    var options = {
      cht: "bhs",
      chs: "400x100",
      chd: "t:" + stats_display,
      chco: color_display,
      chbh: "20",
      chxt: "x",
      chxr: "0,0,40",
      chds: "0,40",
      chdl: modifiers_display,
      chdlp: "b|l",
      chm: "N,003300," + die_roll_pos + ",0,15",
      chtt: chosen_action + " vs " + target + " (DC:" + difficulty + ")"
    }

    var querystring = $.map(options, function(value, key){
      return key + "=" + value;
    }).join("&");

    var url = "https://chart.googleapis.com/chart?" + querystring;

    return url;
  };
  return app;

}());
