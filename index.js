const Discord = require('discord.js');
const client = new Discord.Client();
const apiKey = process.env.apiKey;
const port  = process.env.PORT || 80;

client.on('ready', () => {
  console.log('I am ready!');
});

client.on('message', message => {
  if (message.content === 'ping') {
    message.reply('pong');
  } else if (message.content === 'what is my avatar') {
    // send the user's avatar URL
    message.reply(message.author.avatarURL);
  }
});

client.login(apiKey);