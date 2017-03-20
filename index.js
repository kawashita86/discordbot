const Discord = require('discord.js');
const client = new Discord.Client();
const apiKey = process.env.apiKey;
const port  = process.env.PORT || 80;
let Config = {};
if(!Config.hasOwnProperty("commandPrefix")){
  Config.commandPrefix = '!';
}

let commands = {
  "ping": {
    description: "responds pong, useful for checking if bot is alive",
    process: function(client, msg, suffix) {
      msg.channel.sendMessage( msg.author+" pong!");
      if(suffix){
        msg.channel.sendMessage( "note that !ping takes no arguments!");
      }
    }
  },
  "restart": {
    usage: "[machine]",
    description: "sets bot status to idle",
    process: function(client,msg,suffix){
    }
  },
  "syncdb" : {
    usage: "[machine]",
    description: "sync database on a given machine",
    process: function(client,msg,suffix){
      if(!suffix) {
        msg.channel.sendMessage( `!syncdb command require a [server] arguments`);
      }
      else  //get args list
        msg.channel.sendMessage( `syncing database on machine ${suffix}`);

    }
  },
  "syncbranch" : {
    usage: "[machine] [branch]",
    description: "sets bot status to idle",
    process: function(client,msg,suffix){
      if(!suffix) {
        msg.channel.sendMessage( `!syncbranch command require a [server] [branch] arguments`);
      } else {
        let [machine, branch] = msg.content.split(" ").slice(1);
        if(!branch)
          msg.channel.sendMessage( `!syncbranch command require a [branch] arguments`);

        msg.channel.sendMessage(`syncing database on machine ${machine} branch ${branch}`);
      }
    }
  },
  "idle": {
    usage: "[status]",
    description: "sets bot status to idle",
    process: function(client,msg,suffix){
      client.user.setStatus("idle");
      client.user.setGame(suffix);
    }
  },
  "online": {
    usage: "[status]",
    description: "sets bot status to online",
    process: function(client,msg,suffix){
      client.user.setStatus("online");
      client.user.setGame(suffix);
    }
  },
  "say": {
    usage: "<message>",
    description: "bot says message",
    process: function(client,msg,suffix){ msg.channel.sendMessage(suffix);}
  },
  "eval": {
    usage: "<command>",
    description: 'Executes arbitrary javascript in the bot process. User must have "eval" permission',
    process: function(client,msg,suffix) {
        msg.channel.sendMessage( eval(suffix,client));
    }
  }
};

client.on('ready', () => {
  console.log('I am ready!');
});

client.on('message', message =>
  checkMessageForCommand(message, false)
);

client.login(apiKey);

function checkMessageForCommand(msg, isEdit) {
  //check if message is a command
  if(msg.author.id != client.user.id && (msg.content.startsWith(Config.commandPrefix))){
    console.log("treating " + msg.content + " from " + msg.author + " as command");
    let cmdTxt = msg.content.split(" ")[0].substring(Config.commandPrefix.length);
    let suffix = msg.content.substring(cmdTxt.length+Config.commandPrefix.length+1);//add one for the ! and one for the space
    let cmd = commands[cmdTxt];
    if(cmd) {
          cmd.process(client,msg,suffix,isEdit);
    } else {
      msg.channel.sendMessage(cmdTxt + " not recognized as a command!").then((message => message.delete(5000)))
    }
  } else {
    //message isn't a command or is from us
    //drop our own messages to prevent feedback loops
    if(msg.author == client.user){
      return;
    }

    if (msg.author != client.user && msg.isMentioned(client.user)) {
      msg.channel.sendMessage(msg.author + ", you called?");
    } else {

    }
  }
}