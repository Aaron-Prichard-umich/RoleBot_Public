/*
Project Desc: Discord Bot to assist in managing roles and channels for students to access the appropriate information channels for their courses. 
(OOP Project for CSC 325)
Developer: Aaron Prichard
Current ToDo:
get bot to interact with messages in testing server: :)
implement create channel command: :(
implement create role command: :(
*/
const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Permissions, Guild, ChannelType } = require(`discord.js`);
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
    const name = args.shift();
    if(command === "test"){
        message.channel.send("Test passed");
    }
    if(command === "makecourse"){ 
        try{
            const newCat = message.guild.channels.create({  //part of todo for setting category
                name: name, 
                type: ChannelType.GuildCategory,
            });
            message.guild.channels.create({ 
                name: "Announcements-" + name, 
                type: ChannelType.GuildText,
                category: newCat, //part of todo for setting category
            });
            message.guild.channels.create({ 
                name: "zoom-meeting-info-" + name, 
                type: ChannelType.GuildText,
            });
            message.guild.channels.create({ 
                name: "chat " + name, 
                type: ChannelType.GuildText,
            });
            message.channel.send("Group created for " + name + "🫡");
        }
        catch (e){
            message.channel.send("Could not Create Channel");
            message.channel.send("e");
        }
    }
})

client.login(config.token);