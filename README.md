# Role_Bot_CSC325
Discord bot for creating/assigning roles and channels for courses.

## License
MIT Open source License

## Requirements
* latest install of node.js and Discord.js (Discord.js v14.9 and node.js v19 at time of writing) Simply run npm install for both packages in the folder that the bot's code is cloned to
* inviting bot to server with admin permissions
* You must assign your discord user ID in the developer or admin global variables at the top of the Index.js file to be able to execute commands
* Discord Developer Key and Somewhere to host bot as I am not hosting this bot persistently

## Description
This bot will help manage/organize roles, permissions, categories, and channels within a server based on a structure of categories as courses with channels for different purposes within the categories. e.g.: CSC-325 as a category with chat, announcements, and introduce yourself as channels within that category. A description of the commands it can handle are as follows and can be seen with the !help command in the bot.

### Commmands
    * !makecourse
        Description: Creates a new course with the given name. Adds how-to-make-a-video channel if workshop is entered after course name. Requires admin or developer permission.
        Usage: !makecourse [name] [workshop?] (!makecourse csc-325 workshop)

    * !startsemester
        Description: Starts a new semester by sending a role selection message to the role-request channel.
        Usage: !startsemester

    * !endsemester
        Description: Promotes students to veterans and archives channels. Requires admin or developer permission.
        Usage: !endsemester

    * !setsemester
        Description: Sets the semester for the given course name. Requires admin or developer permission.
        Usage: !setsemester [semester] (!setsemester Summer 2023)

    * !deletecourse
        Description: Deletes the given course name. Requires admin or developer permission.
        Usage: !deletecourse [name] (!deletecourse csc325)

    * !cohab
        Description: Merges two existing courses into one. Requires admin or developer permission.
        Usage: !cohab [course1] [course2] (!cohab csc-325 cis-325)

    * !s
        Description: Saves data to JSON manually. Requires admin or developer permission.
        Usage: !s

    * !d
        Description: Deletes JSON manually. Requires admin or developer permission.
        Usage: !d

    * !insertRole
        Description: Sorts student and veteran role manually in the case of an interruption in course creation or role that was made manually. Requires admin or developer permission.
        Usage: !insertRole [course name]
