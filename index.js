const Discord = require('discord.js');
const client = new Discord.Client();
const apiKey = process.env.apiKey;

client.on('ready', () => {
  console.log('I am ready!');
});

client.on('message', message => {
  if (message.content === 'ping') {
  message.reply('pong');
}
});

client.login(apiKey);