"use strict";
import Permissions from './util/Permissions';
let fs = require('fs');
let path = require('path');
const Discord = require('discord.js');
const client = new Discord.Client();
let apiKey = process.env.apiKey;
const port  = process.env.PORT || 80;
const redis = require('redis').createClient(process.env.REDIS_URL);
const task_directory = path.join(__dirname, "/tasks/");
const task_folders = getDirectories(task_directory);
let Config = {};
let permissions = new Permissions();
if(!Config.hasOwnProperty("commandPrefix")){
  Config.commandPrefix = '!';
}

redis.on("error", function (err) {
  console.log("Error " + err);
  redis.quit();
});

try{
  let content = require(path.join(__dirname, "../env/env"));
  apiKey = content.apiKey;
}catch(e){
  console.log('no env file found');
}

Config.apiKey = apiKey;


try{
  permissions.importPermission(require("./permissions"));
} catch(e){
  console.log('no permissions configuration set');
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
  "unlock" : {
    usage: "[key]",
    description: "sync database on a given machine",
    process: function(client,msg, suffix){
      if(!suffix) {
        msg.channel.sendMessage( `!syncdb unlock require a [key] arguments`);
      } else {
        redis.del(`${suffix}`, (err, reply) => {
          console.log(reply);
          msg.channel.sendMessage(`unlock key ${suffix}`);
        });
    }
  },
  "syncdb" : {
    usage: "[machine]",
    description: "sync database on a given machine",
    process: function (client, msg, suffix) {
      if (!suffix) {
        msg.channel.sendMessage(`!syncdb command require a [server] arguments`);
      }
      else {//get args list
        redis.exists(`syncdb_${suffix}`, (err, reply) => {
          if (reply == 1)
            msg.channel.sendMessage(`database on machine ${suffix} is already syncing, please wait`);
          else {
            redis.set(`syncdb_${suffix}`, 1, redis.print);
            msg.channel.sendMessage(`syncing database on machine ${suffix}`);
          }
        });
      }

    }
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
        else
          msg.channel.sendMessage(`syncing branch on machine ${machine} branch ${branch}`);
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

client.on("messageUpdate", (oldMessage, newMessage) => {
  checkMessageForCommand(newMessage,true);
});

function commandCount(){
  return Object.keys(commands).length;
}

function addCommand (commandName, commandObject) {
  try {
    commands[commandName] = commandObject;
  } catch (err) {
    console.log(err);
  }
}

client.login(Config.apiKey);

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

function loadTasks(){
  let commandCount = 0;
  for (let i = 0; i < task_folders.length; i++) {
    let task;
    try{
      task = require(task_directory + task_folders[i])
    } catch (err){
      console.log("Improper setup of the '" + task_folders[i] +"' task. : " + err);
    }
    if (task){
      if("commands" in task){
        for (let j = 0; j < task.commands.length; j++) {
          if (task.commands[j] in task){
            addCommand(task.commands[j], task[task.commands[j]])
            commandCount++;
          }
        }
      }
    }
  }
  console.log("Loaded " + commandCount() + " chat commands")
}

function getDirectories(srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
    return fs.statSync(path.join(srcpath, file)).isDirectory();
  });
}