var express = require('express');
var bodyParser = require('body-parser');
var https = require('https');
var http = require('http');
var app = express();
app.use(bodyParser.json());

// Headers:
var headers = {
  'Content-Type': 'application/json',
}

var COMMANDS = [
  "command",
  "boob",
  "rides",
  "help",
  "(╯°□°）╯︵",
  "┻━┻",
  "weather"
];

// Variable holding GroupMe options.
var post_options = {
  host: "api.groupme.com",
  path: "/v3/bots/post",
  method: "POST",
  headers: headers
};

// Get Groups options
var get_group_options = {
  host: "api.groupme.com",
  path: "/v3/groups/12730452?token=7EW2z2X3PkaQiKXqnM1NBJoadUU5uPgcBYVoKkIF",
  method: "GET"
}

// GET Options for weather
var get_weather_options = {
  host: "api.openweathermap.org",
  path: "/data/2.5/weather?q=",
  method: "GET"
}

// TESTING ENDPOINT. ONLY COMMENT IT IN WHEN NECESSARY.
// app.post('/test', function(req, res){
//   console.log("Testing with incoming string.");
//   console.log("Text = " + req.body.text);
//   console.log("Result = " + checkForCommand(req.body.text));
//   res.send('hello world');
// });

app.post('/textprocess', function(req, res){
  //var outputText = querifyText(req.body.text);
  if(req.body.name != "Bob"){
    var incomingText = req.body.text;
    var commandType = checkForCommand(incomingText);
    if(commandType && commandType != "weather"){
      var outputText = processCommand(incomingText, commandType);
      if(commandType != "ride"){
        var post_to_group = https.request(post_options, callbackFunction);
        post_to_group.write(outputText);
        post_to_group.end();
      }
    }
  };
});

var server = app.listen(3000, function() {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app on http://%s:%s', host, port);

});

callbackFunction = function(response){
  var str = 'Response: ';
  response.on('data', function (chunk) {
    console.log("got some data");
    str += chunk;
  });

  response.on('end', function () {
    console.log(str);
  });
};

// Parse the incoming text so that each word is read as a token.
// This will break the incoming text message into a series of tokens
// in a list. A message would be broken as follows:
// Input: "The quick brown fox ".
// Output: {["The"] ["quick"] ["brown"] ["fox"]}
// Check to see if we should send the message; this
// is done by checking for certain keywords.
function checkForCommand(inText){
  
  //If the message does not have "hey bob" (with any caps) just ignore it right away
  if (inText.toLowerCase().indexOf("hey bob") == -1){
    return "";
  }
  
  // parse incoming text
  var parsedText = inText.split(" ");
  // Here we will compare it to the established constant array. The array will
  // have to be updated per command.
  var resultIndex = -1;
  for ( var i = 0; i < parsedText.length; i++ ) {
    if ( COMMANDS.indexOf(parsedText[i].toLowerCase()) != -1 ){
      resultIndex = COMMANDS.indexOf(parsedText[i]);
      break;
    }
  }
  
  switch ( resultIndex ){
    case 0:
        return "command";
        break;
    case 1:
        return "andrew";
        break;
    case 2:
        return "ride";
        break;
    case 3:
        return "help";
        break;
    case 4:
        var flipperIndex = parsedText.indexOf(COMMANDS[4]);
        var tableIndex = parsedText.indexOf(COMMANDS[5]);
        if ( flipperIndex === ( tableIndex - 1 )){
          return "table";
        } else {
          return "fake_flip";
        }
        break;
    case 6:
    //// OMG THIS IS SO HACKY WTF.
    // We should try to do all of the commands in this way, essentially
    // removing the 'processCommand' function. This is the first step along the
    // way; eventually we should remove the check above.
        checkWeather(parsedText[parsedText.indexOf(COMMANDS[6]) + 2]);
        return "weather";
    default:
        return "";
        break;
  }
};

// Need to return a json string from here.
function processCommand(incomingMessage, commandType){
  var result = "";
  switch(commandType){
    case "command":
        result = dealWithCommand(incomingMessage);
        break;
    case "andrew":
        // Dammit.
        result = dealWithAndrew();
        break;
    case "ride":
        // Ridestuff
        result = setupRides();
        break;
    case "table":
        result = tableUnflip();
        break;
    case "help":
        result = printHelp();
        break;
    case "fake_flip":
        result = fakeFlip();
        break;
    default:
        console.log("Something went so wrong.");
        die("Sorry.");
  }
  return result;
};

function dealWithCommand(incomingMessage){
  var message = "I will now " + incomingMessage.substring(incomingMessage.indexOf("command") + 7);
  var converted = JSON.stringify({
    bot_id: "e6bfe26f62a4b141c7bdd76425",
    text: message
  });
  return converted;
};

function dealWithAndrew(){
  var message = "Dammit Andrew. Stop doing that.";
  var converted = JSON.stringify({
    bot_id: "e6bfe26f62a4b141c7bdd76425",
    text: message
  });
  return converted;
};

function setupRides(){
  // Here we use the Get options, set up a call to groups
  // so that we can get users, then call the callback()
  // First things first. Make a call to the groupme API for the group.
  // DO THIS IF WE DON'T ALREADY HAVE A LIST FIRST.
  var message = "Please wait:";
  var converted = JSON.stringify({
    bot_id: "e6bfe26f62a4b141c7bdd76425",
    text: message
  });
  // Now, before we send back the message, we start a callback
  // that we can have send a message at a later time.
  var get_users = https.request(get_group_options, function(res){
    var body = '';
    res.on('data', function(d){
      body += d;
    });
    res.on('end', function(){
      var json_body = JSON.parse(body);
      console.log(json_body);
      userlistToGroup(json_body);
      //console.log('BODY: ' + body);
    });
  });
  //post_to_group.write(outputText);
  get_users.end();
  
  return converted;
};

function userlistToGroup(json_object){
  // Send the number of users in the group to the group, for starters.
  // Having gotten the number to work, let's send the list of users.
  var userList = "";
  for (var i = 0; i < json_object.response.members.length; i++){
    userList += json_object.response.members[i].nickname + ", "
  };
  var message = "The available members are: " + userList.substring(0, userList.length - 2) + ".";
  message = message + " Random driver is: " + json_object.response.members[Math.floor(Math.random() * (json_object.response.members.length))].nickname;
  //var number_of_users = json_object.response.members.length;
  var outputText = JSON.stringify({
    bot_id: "e6bfe26f62a4b141c7bdd76425",
    text: message
    //text: "There are " + number_of_users + " users"
  });
  var post_to_group = https.request(post_options, callbackFunction);
  post_to_group.write(outputText);
  post_to_group.end();
};

function getUsers(res){
  // Here we have the response to "GET /v3/groups/<group_id>?token=<token>"
  // What we now do is get the correct information out of the response body,
  // and return the list of users as an array.
  var list_of_members = res.response.members;
  var list_of_names = [];
  for(var i= 0; i < list_of_members.length; i++){
    list_of_names.push(list_of_members[i].nickname);
    console.log(list_of_names[i]);
  }
  return list_of_names;
};

function tableUnflip(){
  // Because it was easy.
  var message = "┬──┬ ﾉ(°—°ﾉ)";
  var converted = JSON.stringify({
    bot_id: "e6bfe26f62a4b141c7bdd76425",
    text: message
  });
  return converted;
};

function printHelp(){
  // Quickly.
  var commands="This is what I can do:\n" +
  "Command[text]                - echo whatever is in [text].\n" +
  "Boob                         - tell Andrew to cut that out.\n" +
  "(╯°□°）╯︵ ┻━┻                - Bob will unflip your table for you.\n"+
  "rides                        - pick a random person in the group to drive.\n"+
  "Bob Help                     - Print this help."
  var converted = JSON.stringify({
    bot_id: "e6bfe26f62a4b141c7bdd76425",
    text: commands
  });
  return converted;
};

function fakeFlip(){
  // Stubs
  var message = "You didn't flip a table gai. You need to flip a table.";
  var converted = JSON.stringify({
    bot_id: "e6bfe26f62a4b141c7bdd76425",
    text: message
  });
  return converted;
};

function checkWeather(location){
  // Here we use the Get options, set up a call to groups
  // so that we can get users, then call the callback()
  // First things first. Make a call to the groupme API for the group.
  // DO THIS IF WE DON'T ALREADY HAVE A LIST FIRST.
  var message = "Please wait:";
  var converted = JSON.stringify({
    bot_id: "e6bfe26f62a4b141c7bdd76425",
    text: message
  });
  
  // Now, before we send back the message, we start a callback
  // that we can have send a message at a later time.
  get_weather_options.path = get_weather_options.path + location + "&units=imperial&APPID=3dc624292d12c666824acad2eec8bbcb"
  console.log(get_weather_options);
  // var get_weather = https.request(get_weather_options, function(res){
  //   var body = '';
  //   res.on('data', function(d){
  //     body += d;
  //   });
  //   res.on('end', function(){
  //     var json_body = JSON.parse(body);
  //     //console.log(json_body);
  //     grabWeatherResults(json_body);
  //     //console.log('BODY: ' + body);
  //   });
  // });
  // //post_to_group.write(outputText);
  // get_weather.end();
  
  return converted;
};

function grabWeatherResults(json_results){
  // Parse out the temperature, then send it to the group.
  var message = "The weather in " + json_results.name + " is " + json_results.main.temp + " Fahrenheit";
  var outputText = JSON.stringify({
    bot_id: "e6bfe26f62a4b141c7bdd76425",
    text: message
    //text: "There are " + number_of_users + " users"
  });
  var post_to_group = https.request(post_options, callbackFunction);
  post_to_group.write(outputText);
  post_to_group.end();
};