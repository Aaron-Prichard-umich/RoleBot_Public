
const {EmbedBuilder} = require("discord.js"); 

function createHelpEmbed() {
     const embed = new EmbedBuilder()
     .setTitle("Command List")
     .setDescription("List of available commands:")
     .setColor("#0099ff")
     .addFields(
       { name: "!test", value: "!test", inline: false },
       {
         name: "!makecourse",
         value:"!makecourse [name] [workshop?] (!makecourse csc-325 workshop) - Creates a new course with the given name. Adds how-to-make-a-video channel if workshop is entered after course name. Requires admin or developer permission.",
         inline: false,
       },
       {
         name: "!startsemester",
         value:"!startsemester - Starts a new semester by sending a role selection message to the role-request channel",
         inline: false,
       },
       {
         name: "!endsemester",
         value:"!endsemester - Promotes students to veterans and archives channels. Requires admin or developer permission.",
         inline: false,
       },
       {
         name: "!setsemester",
         value:"!setsemester [semester] (!setsemester Summer 2023)- Sets the semester for the given course name. Requires admin or developer permission.",
         inline: false,
       },
       {
         name: "!deletecourse",
         value:"!deletecourse [name] (!deletecourse csc325) - Deletes the given course name. Requires admin or developer permission.",
         inline: false,
       },
       {
         name: "!cohab",
         value:"!cohab [course1] [course2] (!cohab csc-325 cis-325) - Merges two existing courses into one. Requires admin or developer permission.",
         inline: false,
       },
       {
         name: "!s",
         value:"!s save data to JSON manually. Requires admin or developer permission.",
         inline: false,
       },
       {
         name: "!d",
         value:"!d delete JSON manually. Requires admin or developer permission.",
         inline: false,
       },
       {
        name: "!insertRole",
        value:"!insertRole [course name] sort student and veteran role manually in the case of an interruption in course creation or role that was made manually. Requires admin or developer permission.",
        inline: false,
      },
     );
return embed;
}

// Export
module.exports = {
    createHelpEmbed
};