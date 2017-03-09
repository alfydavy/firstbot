// starts here

var os = require('os');

var Botkit = require('botkit');

var controller = Botkit.slackbot({
	//debug: true,
});


/*

// connect the bot to a stream of messages
controller.spawn({
  //token: <my_slack_bot_token>,
	token:require('./config').token	
	
}).startRTM()
*/





// close the RTM for the sake of it in 5 seconds Do this only when in live prod

/*
  setTimeout(function() {
      bot.closeRTM();
  }, 10000);
  
 */


// connect the bot to a stream of messages
var bot = controller.spawn({
	//token: my_slack_bot_token
	token: require('./config').token

});


bot.startRTM(function(err, bot, payload) {
	if (err) {
		throw new Error('Could not connect to Slack')
	}

});



/*
  var bot = controller.spawn({
      token:require('./config').token
      //token: process.env.token		  
  }).startRTM();
*/

// give the bot something to listen for.
/*

controller.hears(["hello", "hello koko", "hi", "hola", "anybody at home", "namaste", "???" ],['direct_message','direct_mention','mention'],function(bot,message) {

console.log(message);

if (message.text == "hi" || "hello" || "hello koko" || "koko") {
		
  	 bot.reply(message,'Hello there how re you doing today; My name is Koko; what is your name ? ');
	 
}
else if (message.text == "call me (.*) " || "my name is (.*)" ) {
	bot.reply(message,'Got it. I will call you ' + user.name + ' from now on. I will be taking your interview; shall we proceed?');
}

else if (message.text == "yes" || "go ahead" || "sure" ) {
	bot.reply(message,'so tell me something about yourself; what kind of roles have you essayed');
}
else if (message.text == "Java" || "Javascript") {
	
	
	bot.reply(message,'Hello how re you doing today; what kind of role do you essay ?');
}
else if (message.text == "developer" || "manager" || "architect") {
	
	
	bot.reply(message,'Oh Cool in what technologies ? ');
}

});

*/






controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function(bot, message) {

	bot.api.reactions.add({
		timestamp: message.ts,
		channel: message.channel,
		name: 'Koko',
	}, function(err, res) {
		if (err) {
			bot.botkit.log('Failed to add emoji reaction :(', err);
		}

	});



	controller.storage.users.get(message.user, function(err, user) {
		if (user && user.name) {
			bot.reply(message, 'Hello ' + user.name + ' how are you doing today, my name is koko');
		} else {
			bot.reply(message, 'Hello my name is koko. what is your name?');
		}
	});
});





controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
	var name = message.match[1];
	controller.storage.users.get(message.user, function(err, user) {
		if (!user) {
			user = {
				id: message.user,
			};
		}
		user.name = name;
		controller.storage.users.save(user, function(err, id) {
			bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
		});
	});
});

// this needs to be reworked



controller.hears(['what is my name', 'who am i'], 'direct_message,direct_mention,mention', function(bot, message) {

	controller.storage.users.get(message.user, function(err, user) {
		if (user && user.name) {
			bot.reply(message, 'Your name is ' + user.name);
		} else {
			bot.startConversation(message, function(err, convo) {
				if (!err) {
					convo.say('I do not know your name yet!');
					convo.ask('What should I call you?', function(response, convo) {
						convo.ask('You want me to call you `' + response.text + '`?', [{
							pattern: 'yes',
							callback: function(response, convo) {
								// since no further messages are queued after this,
								// the conversation will end naturally with status == 'completed'
								convo.next();
							}
						}, {
							pattern: 'no',
							callback: function(response, convo) {
								// stop the conversation. this will cause it to end with status == 'stopped'
								convo.stop();
							}
						}, {
							default: true,
							callback: function(response, convo) {
								convo.repeat();
								convo.next();
							}
						}]);

						convo.next();

					}, {
						'key': 'nickname'
					}); // store the results in a field called nickname

					convo.on('end', function(convo) {
						if (convo.status == 'completed') {
							bot.reply(message, 'OK! I will update my dossier...');

							controller.storage.users.get(message.user, function(err, user) {
								if (!user) {
									user = {
										id: message.user,
									};
								}
								user.name = convo.extractResponse('nickname');
								controller.storage.users.save(user, function(err, id) {
									bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
								});
							});



						} else {
							// this happens if the conversation ended prematurely for some reason
							bot.reply(message, 'OK, nevermind!');
						}
					});
				}
			});
		}
	});
});


controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function(bot, message) {

	bot.startConversation(message, function(err, convo) {

		convo.ask('Are you sure you want me to shutdown?', [{
			pattern: bot.utterances.yes,
			callback: function(response, convo) {
				convo.say('Bye!');
				convo.next();
				setTimeout(function() {
					process.exit();
				}, 3000);
			}
		}, {
			pattern: bot.utterances.no,
			default: true,
			callback: function(response, convo) {
				convo.say('*Phew!*');
				convo.next();
			}
		}]);
	});
});


controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
	'direct_message,direct_mention,mention',
	function(bot, message) {

		var hostname = os.hostname();
		var uptime = formatUptime(process.uptime());

		bot.reply(message,
			':robot_face: I am a bot named <@' + bot.identity.name +
			'>. I have been running for ' + uptime + ' on ' + hostname + '.');

	});

function formatUptime(uptime) {
	var unit = 'second';
	if (uptime > 60) {
		uptime = uptime / 60;
		unit = 'minute';
	}
	if (uptime > 60) {
		uptime = uptime / 60;
		unit = 'hour';
	}
	if (uptime != 1) {
		unit = unit + 's';
	}

	uptime = uptime + ' ' + unit;
	return uptime;
}
