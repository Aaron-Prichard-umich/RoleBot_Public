/*
Project Desc: Discord Bot to assist in managing roles and channels for students to access the appropriate information channels for their courses. 
(OOP Project for CSC 325)
Developer: Aaron Prichard
Current ToDo: ✅ 🚩
get bot to interact with messages in testing server: ✅
implement create channel command: ✅
implement role assignment poll: ✅
assign roles after retrieving them: ✅
control permissions for roles and courses: ✅
account for edge cases like classes or roles already existing: ✅
implement color selection for roles: ✅
make roles slightly darker for veterans: 🚩
*/
const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Permissions, Guild, ChannelType, ActivityType, ActionRowBuilder, Events, StringSelectMenuBuilder, GuildMemberRoleManager, RoleSelectMenuBuilder, PermissionOverwrites, PermissionOverwriteManager, PermissionFlagsBits, Role, User } = require(`discord.js`);
const prefix = '!';
const config = require('./config.json');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});
const courses = []; //keep track of courses created for starting semester
const semester = "Spring 2023"; //global for semester. Needs setter function for setting from discord.

client.on("ready", () => {
    console.log("Role Bot is online!");
    client.user.setActivity('Beep Boop', {type: ActivityType.Listening});
})

client.on(Events.InteractionCreate, roleSelected => { //listener for role selection from selectmenu. assign role selected in menu.
    if (!roleSelected.isStringSelectMenu()) return
    const roleToAdd = roleSelected.guild.roles.cache.find(role => role.name === roleSelected.values[0])
    const targetMember = roleSelected.member
    let replyOptions = {content: "role removed!", ephemeral: true}
    if(targetMember.roles.cache.has(roleToAdd.id)){
        targetMember.roles.remove(roleToAdd)
    }
    else{
        replyOptions = {content: "role added!", ephemeral: true}
        targetMember.roles.add(roleToAdd)
    }
    roleSelected.reply(replyOptions)
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
        if(!message.guild.channels.cache.find(channel => channel.name === name + " - " + semester)){
            try{
                    let channelRole = null;
                    const roleName = name + " Students";
                    if(!message.guild.roles.cache.find(role => role.name === roleName )){
                        const color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
                        channelRole = createRole(roleName, color, message);
                        createRole(name + " Veterans", color, message);
                    }
                    
                const everyoneRole = message.guild.roles.everyone;
                channelRole.then(() => {
                newRole = message.guild.roles.cache.find(role => role.name === roleName)
                const channelOptions = {  //create category/course grouping from second argument of makecourse command
                    name: name + " - " + semester,
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        {id: message.guild.roles.cache.find(role => role.name === roleName).id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]},
                        {id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel]},
                    ],
                }
                
                message.guild.channels.create(channelOptions).then((channel) =>{
                    makeCourse("Announcements " + name, ChannelType.GuildText, message, channel);  //populate with standard channels
                    makeCourse("zoom-meeting-info " + name, ChannelType.GuildText, message, channel);
                    makeCourse("chat " + name, ChannelType.GuildText, message, channel);
                })});
                
                courses.push(name);
                message.channel.send("Group created for " + name + " 🫡");
            }
            catch (e){
                message.channel.send("Could not Create Course");
                message.channel.send("error " + e);
            }
        }//end of !message.guild.channels.cache.find(channel) if statement.
        else{message.channel.send("course already exists");}
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
					.setPlaceholder('select a role'),
			);
            for(n in courses){
                roleSelect.components[0].addOptions({
                    label: courses[n],
                    description: "select if you are registered for " + courses[n],
                    value: courses[n] + " Students",
                })
            } 
            channel.send({ content: 'select to get access to channels for your courses (select again to remove if added by mistake)', components: [roleSelect] });
  }

async function createRole(name, color, message){
    const roleOptions = {
        name: name,
        color: color
        };
    
       newRole = await message.guild.roles.create(roleOptions);
       return newRole;
       
}


client.login(config.token);