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

app.post('/textprocess', function(req, res){
  //var outputText = querifyText(req.body.text);
  if(req.body.name != "Bob"){
    var incomingText = req.body.text;
    var commandType = checkForCommand(incomingText);
    if(commandType){
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
	
	// parse incoming text
	var parsedText = inText.split(" ");
	
	// Let's check for "hey bob"
	var numberOfTokens = parsedText.length;
	for(var i = 0; i < numberOfTokens; i++) {
		if(parsedText[i].indexOf("Hey") > -1 || parsedText.indexOf("hey") > -1){
			if (parsedText[i+1].indexOf("Bob") > -1 || parsedText[i+1].indexOf("bob") > -1){
				
			}
		}	
				
	}
	
	
  if(inText.indexOf("command") > -1 || inText.indexOf("Command") > -1){
    // The text contains the word we're looking for (command for now)
    // This can be extended to a series of checks for different commands
    return "command";
  }
  else if (inText.indexOf("boob") > -1 || inText.indexOf("Boob") > -1){
    return "andrew";
  }
  else if (inText.indexOf("(╯°□°）╯︵ ┻━┻") > -1){
    return "table";
  }
  else if(inText.indexOf("Rides") > -1 || inText.indexOf("rides") > -1){
    return "ride";
  }
  else if(inText.indexOf("Bob help") > -1 || inText.indexOf("Bob Help") > -1){
    return "help";
  }
  else{
    return "";
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
}