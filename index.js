/*
Project Desc: Discord Bot to assist in managing roles and channels for students to access the appropriate information channels for their courses. 
(OOP Project for CSC 325)
Developer: Aaron Prichard
Current ToDo:
get bot to interact with messages in testing server: :)
implement create channel command: :)
implement role assignment poll: :(
*/
const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Permissions, Guild, ChannelType, ActivityType, ActionRowBuilder, Events, StringSelectMenuBuilder } = require(`discord.js`);
const prefix = '!';
const config = require('./config.json');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});
const courses = ["testCat"]; //keep track of courses created for starting semester
const semester = "Spring 2023"; //global for semester. Needs setter function for setting from discord.

client.on("ready", () => {
    console.log("Role Bot is online!");
    client.user.setActivity('Beep Boop', {type: ActivityType.Listening});
})

client.on(Events.InteractionCreate, roleSelected => { //listener for role selection from selectmenu. assign role selected in menu.
    if (!roleSelected.isStringSelectMenu()) return;
    console.log(roleSelected.values[0]);
}); 

client.on("messageCreate", (message) => {
    if(!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase(); //stores command/argument 0
    const name = args.shift(); //name of course/argument 1
    if(command === "test"){
        message.channel.send("Test passed");
    }
    if(command === "makecourse"){ 
        try{
            const newCat = message.guild.channels.create({  //create category/course grouping from second argument of makecourse command
                name: name+ " - " +semester, 
                type: ChannelType.GuildCategory,
            }).then((channel) =>{
                makeCourse("Announcements " + name, ChannelType.GuildText, message, channel);  //populate with standard channels
                makeCourse("zoom-meeting-info " + name, ChannelType.GuildText, message, channel);
                makeCourse("chat " + name, ChannelType.GuildText, message, channel);
            });
            courses.push(name);
            message.channel.send("Group created for " + name + " 🫡");
        }
        catch (e){
            message.channel.send("Could not Create Channel");
            message.channel.send("error " + e);
        }
    }
    if(command === "startsemester"){
        try{
            rolePoll(courses);
        }
        catch(e){
            message.channel.send("error " + e);
            console.log(e);
        }
    }
})

function makeCourse(name, type, message, channel) { //function for making courses in the category passed to it by channel.
    message.guild.channels.create({ 
        name: name, 
        type: type,
        parent: channel,
    });
  }

  function rolePoll(courses) { //create poll message with course names stored from makeCourse commands.
    const channel = client.channels.cache.find(channel => channel.name === "role-request");
    const roleSelect = new ActionRowBuilder()
			.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId('roleselect')
					.setPlaceholder('Choose registered course')
					.addOptions(
						{
							label: 'CSC 1337',
							description: 'select if you are enrolled in CSC 1337',
							value: '1337 students',
						},
						{
							label: 'veteran test',
							description: 'assigns veteran role',
							value: '1337 veterans',
						},
					),
			);
            channel.send({ content: 'select a role', components: [roleSelect] });
  }

client.login(config.token);