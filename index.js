const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Permissions, Guild } = require(`discord.js`);
const prefix = '!';
const config = require('./config.json');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on("ready", () => {
    console.log("Role Bot is online!");
    client.user.setActivity('Beep Boop');
})

client.on("messageCreate", (message) => {
    if(!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();
    if(command === "test"){
        message.channel.send("Test passed");
    }
    if(command === "makech"){
        Guild.channels.create('new-general')
    }
})

client.login(config.token);