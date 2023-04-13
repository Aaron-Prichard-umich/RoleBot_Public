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
implement color selection for roles: ✅ currently a transient error where value generated is invalid color, still troubleshooting
make roles slightly darker for veterans: 🚩 possible approach: split hex into R, G, B strings, subtract 1 from each, reconstruct hex
implement promotion of students to veterans in endsemester cmd: ✅
implement archiving channels in endsemester cmd: ✅
Ensure alphanumeric order of roles when adding roles: ✅
Add function for Cohabitating courses: ✅
Needs a little more error handling so it doesn't crash from transient errors, but there are contingencies to come back from a crash for now.
*/
const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Permissions, Guild, ChannelType, ActivityType, ActionRowBuilder, Events, StringSelectMenuBuilder, GuildMemberRoleManager, RoleSelectMenuBuilder, PermissionOverwrites, PermissionOverwriteManager, PermissionFlagsBits, Role, User, ButtonBuilder } = require(`discord.js`);
const prefix = '!';
const config = require('./config.json');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});
const {createHelpEmbed} = require("./embedTemplate.js");
const fs = require('fs');
let optional = "";
let courses = []; //keep track of courses created for starting semester
let roles = []; //separate array for roles in the event there are cohabitated courses
let semester = "Spring 2023"; //global for semester.
//ids for bot to react to. I don't think these need to be abstracted as they are easily optained by anyone in the server or extracted by discord.js code.
const adminId = "378011482153025536"; //dr spradling id
const developerId = "832403471026225163"; //developer id (mine right now)
client.on("ready", () => {
    console.log("Role Bot is online!");
    client.user.setActivity('Beep Boop', {type: ActivityType.Listening});
    loadData();
})
//listener for role selection from button. assign role selected from button.    

client.on(Events.InteractionCreate, roleSelected => { 
    if (!roleSelected.isButton()) return
    if(!roleSelected.customId.endsWith(' Students')){ return }
    else{
    const roleToAdd = roleSelected.guild.roles.cache.find(role => {
        return role.name === roleSelected.customId;
    })
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
}});
//listener for warning embed button interactions (continue/cancel)
client.on(Events.InteractionCreate, warningEvent => {
    if(!warningEvent.isButton() && (warningEvent.customId === 'cancel' || warningEvent.customId === 'continue')){
        return;
    }
    const server = warningEvent.guildId
    if(warningEvent.customId.endsWith("endsemester")){
        if(warningEvent.customId === 'cancel endsemester'){ //delete the message if cancelled
            warningEvent.reply({content: "Cancelled Promotion", ephemeral: true});
            warningEvent.message.delete();
            
        }
        else if(warningEvent.customId === 'continue endsemester'){ //promote all the students if continued
            
            for(const role of roles){
                promoteStudents(server, role);
            }
            for(const course of courses){
                resetPermissions(server, course + " - " + semester);
            }
            
            warningEvent.reply({content: "Promoting Students and Archiving Channels...", ephemeral: true});
            clearData();
        }
    }
    if(warningEvent.customId.endsWith("deletecourse")){
        if(warningEvent.customId === 'cancel deletecourse'){ //delete the message if cancelled
            warningEvent.reply({content: "Cancelled course deletion", ephemeral: true});
            warningEvent.message.delete();
        }
        else if(warningEvent.customId === 'continue deletecourse'){ //delete the course if continued
            deleteCourse(server, optional);
            warningEvent.reply({content: "course " + optional + " deleted", ephemeral: true});
            saveData();
        }
    }
})
//command handler
client.on("messageCreate", (message) => {
    if(!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase(); //stores command/argument 0
    const name = args.shift(); //name of course/argument 1
    const argTwo = args.shift(); //second argument for cohab or other multi-input commands
    if(command === "test"){
        message.channel.send("Test passed");
    }
    if(command === "makecourse" && (message.author.id === developerId || message.author.id === adminId)){
        if(!message.guild.channels.cache.find(channel => channel.name === name + " - " + semester)){
            try{
                    let channelRole = null;
                    const roleName = name + " Students";
                    const color = '#' + (000000 + Math.random()*0xFFFFFF<<0).toString(16).slice(-6);
                    channelRole = createRole(roleName, color, message);
                    createRole(name + " Veterans", color, message);
                    
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
                    makeCourse("Announcements " + name, ChannelType.GuildText, message, channel, [
                        {id: message.guild.roles.cache.find(role => role.name === roleName).id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.AddReactions]},
                        {id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel]}]); 
                    makeCourse("zoom-meeting-info " + name, ChannelType.GuildText, message, channel, [
                        {id: message.guild.roles.cache.find(role => role.name === roleName).id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.AddReactions]},
                        {id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel]}]);
                    makeCourse("chat " + name, ChannelType.GuildText, message, channel, [
                        {id: message.guild.roles.cache.find(role => role.name === roleName).id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.AddReactions, PermissionFlagsBits.SendMessages]},
                        {id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel]}]);
                    if(argTwo === "workshop"){
                    makeCourse("how-to-make-a-video " + name, ChannelType.GuildText, message, channel, [
                        {id: message.guild.roles.cache.find(role => role.name === roleName).id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.AddReactions]},
                        {id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel]}]);
                    }
                    insertRole(name, message);
                })});
                
                courses.push(name);
                roles.push(name);
                message.channel.send("Group created for " + name + " 🫡");
                saveData();
                
            }
            catch (e){
                message.channel.send("Could not Create Course");
                message.channel.send("error " + e);
            }
        }//end of !message.guild.channels.cache.find(channel) if statement.
        else{
            message.channel.send("course already exists");
            courses.push(name);
            roles.push(name);
            saveData();
        }
    }
    if(command === "startsemester" && (message.author.id === developerId || message.author.id === adminId)){
        try{
            rolePoll(roles);
        }
        catch(e){
            message.channel.send("error " + e);
            console.log(e);
        }
    }

    if(command === "endsemester" && (message.author.id === developerId || message.author.id === adminId)){
        warningEmbed(command, message, name);
    }

    if(command === "setsemester" && (message.author.id === developerId || message.author.id === adminId)){
        let newSemester = name + " " + argTwo;
        setSemester(newSemester);
        message.channel.send("semester set to " + name + " " + argTwo)
    }

    if(command === "deletecourse" && (message.author.id === developerId || message.author.id === adminId)){
        warningEmbed(command, message, name);
    }
    if(command === "cohab" && (message.author.id === developerId || message.author.id === adminId)){
        const courseOne = message.guild.channels.cache.find((channel) => {
            return channel.name === name + " - " + semester;
        })
        const courseOneRole = message.guild.roles.cache.find((role) => {
            return role.name === name + " Students";
        })
        const courseTwoRole = message.guild.roles.cache.find((role) => {
            return role.name === argTwo + " Students";
        })
        deleteCourse(message.guildId, argTwo);
        courseTwoRole.permissions.add(courseOneRole.permissions.toArray());
        const permissions = [
            {
            id: courseTwoRole.id,
            allow: [PermissionFlagsBits.ViewChannel],
            },
            {
            id: courseOneRole.id,
            allow: [PermissionFlagsBits.ViewChannel],
            },
        ]
        courseOne.permissionOverwrites.set(permissions);
        const index = courses.indexOf(name);
        courses.splice(index, 1);
        courseOne.setName(name + "/" + argTwo + " - " + semester);
        courses.push(name + "/" + argTwo);
        roles.push(argTwo)
    }
    if(command === 'help' && (message.author.id === developerId || message.author.id === adminId)){
        const embed = createHelpEmbed();
        message.channel.send({embeds: [embed]});
    }
    if(command === "s" && (message.author.id === developerId || message.author.id === adminId)){
        saveData();
    }
    if(command === "d" && (message.author.id === developerId || message.author.id === adminId)){
        clearData();
    }
    if(command === "insertRole" && (message.author.id === developerId || message.author.id === adminId)){
        insertRole(name, message);
    }
})

function makeCourse(name, type, message, channel, permissions) { //function for making courses in the category passed to it by channel.
    message.guild.channels.create({ 
        name: name, 
        type: type,
        parent: channel,
        permissionOverwrites: permissions,
    });
  }

function rolePoll(roles) { //create poll message with course names stored from makeCourse commands.
    const channel = client.channels.cache.find(channel => channel.name === "role-request");
    const roleSelect = new ActionRowBuilder();		
    for(const role of roles){
                const courseButton = new ButtonBuilder()
                .setCustomId(`${role} Students`)
                .setLabel(role)
                .setStyle(1);
                roleSelect.addComponents(courseButton);
            }
            channel.send({ content: 'select to get access to channels for your courses (select again to remove if added by mistake)', components: [roleSelect] });
  }

async function createRole(name, color, message){
    if(!message.guild.roles.cache.find(role => role.name === name )){
        const roleOptions = {
            name: name,
            color: color
            };
        
        newRole = await message.guild.roles.create(roleOptions);
    }
    else{
        newRole = await message.guild.roles.cache.find(role => role.name === name);
    }
        return newRole;
       
}

async function promoteStudents(server, name){
    const guild = await client.guilds.fetch(server);
    const roles = await guild.roles.fetch();
    const studentRole = roles.find(role => {
        return role.name === name + " Students";
    });
    const veteranRole = roles.find(role => {
        return role.name === name + " Veterans";
    })
    if(!studentRole) return;
    const membersWithStudentRole = studentRole.members;
    membersWithStudentRole.forEach(async member => {
        await member.roles.add(veteranRole)
        await member.roles.remove(studentRole)
    });
}

async function resetPermissions( guildId, course) {
    const guild = await client.guilds.fetch(guildId);
    const category = guild.channels.cache.find(category => {
        return category.name === course;
    });
    const permissions = [
      {
        id: guildId,
        deny: [PermissionFlagsBits.ViewChannel],
      },
    ];
    // Reset the permissions for the category
    await category.permissionOverwrites.set(permissions);
    // Reset the permissions for all channels in the category
    const channels = guild.channels.cache.filter(
        (channel) => channel.type === ChannelType.GuildText && channel.parentId === category.id
      );
      
      for (const channel of channels.values()) {
        //await channel.permissionOverwrites.set(permissions);
        channel.lockPermissions(); //sync with parent category
      }
  }

async function deleteCourse(guildId, course){
    let courseToDelete = course + " - " + semester;
    const guild = await client.guilds.fetch(guildId);
    const category = guild.channels.cache.find(category => {
        return category.name === courseToDelete;
    });
    channels = guild.channels.cache.filter(
        (channel) => channel.parentId === category.id
    );
    for(const channel of channels.values()){
        channel.delete()
    }
    category.delete();
    
    let index = courses.indexOf(course);

    courses.splice(index, 1);
    index = roles.indexOf(course);

    roles.splice(index, 1);
    saveData();
}

async function warningEmbed(command, message, name){
    let flag = command;
    optional = name;
    const warningEmbed = new EmbedBuilder()
    .setColor("#FF0000")
    .setTitle(flag + " is a permanent action")
    .setDescription("This cannot be undone!")

const buttonRow = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('continue ' + flag)
            .setLabel('Continue')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('cancel ' + flag)
            .setLabel('Cancel')
            .setStyle(4)
    );

message.channel.send({embeds: [warningEmbed], components: [buttonRow]});
}

function setSemester(newSemester){
    semester = newSemester;
}

async function insertRole(name, message){
    const roleToInsert = await message.guild.roles.cache.find((role) => {
        return role.name === name + " Students"; 
    })
    const veteranRole = await message.guild.roles.cache.find((role) => {
        return role.name === name + " Veterans"; 
    })
    let rolePlaced = false;
    await message.guild.roles.cache.sort((a, b) => b.position - a.position);
    let roleNumberStr = "";
    for(let i = 0; i<name.length; i++){
        if(!isNaN(name[i])){
            roleNumberStr += name[i];
        }
    }
    let roleNumber = parseInt(roleNumberStr);
    let firstStudent = -1;
    for(let i = message.guild.roles.cache.size - 1; i >= 0; i--) {
        const role = [...message.guild.roles.cache.values()][i];
        if(role.name.endsWith("Students") && role != roleToInsert){
            firstStudent = role;
            break; // Exit the loop after finding the first student role
        }
    }
    if(firstStudent === -1){
        return;
    }
    let counterpart = null;
    let lastStudent = null;
    for(let i = message.guild.roles.cache.size - 1; i >= 0; i--) {
        const role = [...message.guild.roles.cache.values()][i];
        if(role.position >= firstStudent.position && parseInt(role.name.match(/\d+/)) > roleNumber){
            await roleToInsert.setPosition(role.position-1);
            counterpart = role;
            rolePlaced = true;
            break;
        }
        if(role.name.endsWith("Students") && role != roleToInsert){
            lastStudent = role;
        }
    }
    
    if(!rolePlaced){
        await roleToInsert.setPosition(lastStudent.position);
    }
    if(counterpart){
        let counterpartRole = await message.guild.roles.cache.find((role)=> {
            return role.name === counterpart.name.replace("Students", "Veterans");
        })
        await veteranRole.setPosition(counterpartRole.position-1);
    }
    else{
        await veteranRole.setPosition(firstStudent.position-1);
    }
}
function saveData() {
    const data = {
      courses: courses,
      roles: roles
    };
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
    console.log('Data saved to file.');
  }
  function loadData() {
    try {
      const data = JSON.parse(fs.readFileSync('data.json'));
      courses = data.courses;
      roles = data.roles;
      console.log('Data loaded from file.');
    } catch (err) {
      console.error('Data not loaded. Ignore on initial startup.');
    }
  }
  
  //clear the saved data in the JSON file
  function clearData() {
    fs.unlinkSync('data.json');
    console.log('Data cleared from file.');
  }


  
client.login(config.token);