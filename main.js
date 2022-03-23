// Require the necessary discord.js classes
const { Client, Intents } = require('discord.js');
config = require('./config.json');

function yourCode(interaction){
  // your code goes here
}

var reload = require('require-reload')(require)

const Sequelize = require('sequelize');
const { Permissions } = require('discord.js');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

fs = require('fs');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS] });

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 
charactersLength));
 }
 return result;
}

const Keys = sequelize.define('keys', {
	key_id: {
    type: Sequelize.STRING,
    primaryKey: true
  },
	creation_time: Sequelize.INTEGER,
	creator: Sequelize.STRING,
  key_used: Sequelize.BOOLEAN,
  user: Sequelize.STRING,
  usage_time: Sequelize.INTEGER,
  expires_in: Sequelize.INTEGER,
});

const Expire = sequelize.define('expire',{
  user_id: {
    type: Sequelize.STRING,
    primaryKey: true,
  }, 
  expires_at: Sequelize.INTEGER,
});

client.once('ready', () => {
	Keys.sync();
  Expire.sync();

  checkExpiry();

	console.log(`Logged in as ${client.user.tag}!`);
});

async function checkExpiry(){
  console.log("I'm running")

  guild = client.guilds.cache.get(config.guildId)
  guild.members.fetch().then(async members =>
    {
      members.forEach(async member =>
        {
          userEntry = await Expire.findOne({ where: { user_id: member.user.id } })

          if(userEntry){
            console.log(userEntry.expires_at)
            if(userEntry.expires_at < Date.now()){
              member.user.send("Your subscription has expired in " + guild.name)

              premiumRole = guild.roles.cache.get(config.giveRoleID);
              freeRole = guild.roles.cache.get(config.defaultRoleID);
              member.roles.remove(premiumRole);
              member.roles.add(freeRole);

              Expire.destroy({where: { user_id: userEntry.user_id }})

              console.log('Premium subscription expired for : ' + userEntry.user_id)
            } 
          }
        });
      });
  
  await delay(60000);

  checkExpiry()
}

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;

	if (commandName === 'setup') {
    if(interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)){

      if(interaction.options.getString('prefix').length > 12){
        return interaction.reply("Prefix must be under 12 charracters in length");
      }

      let jsonFile = JSON.parse(fs.readFileSync('config.json', 'utf8'));
      jsonFile.prefix = interaction.options.getString('prefix');
      jsonFile.generateRoleID = interaction.options.getString('generateroleid');
      jsonFile.action = interaction.options.getString('action');
      jsonFile.giveRoleID = interaction.options.getString('role');
      jsonFile.defaultRoleID = interaction.options.getString('defaultrole');
      jsonFile.fileName = interaction.options.getString('filename');

      fs.writeFileSync('config.json', JSON.stringify(jsonFile));

      config = reload('./config.json');

      return interaction.reply("Config file successfully updated and reloaded.");
    }

    return interaction.reply("Nice try ;)")
	} else if (commandName === 'gen') {
    if(!interaction.member.roles.cache.has(config.generateRoleID)){
      return interaction.reply("You do not have the required role to access this command, if you believe this was a mistake please contact the server administrator.");
    } 

		time = interaction.options.getString('time');
    amount =  interaction.options.getInteger('amount');

    if(amount > 50){
      return interaction.reply("You may only generate up to 50 keys at a time.")
    }

    if(time === "day"){
      time = 86400;
    } else if (time === "week"){
      time = 604800;
    } else if (time === "month"){
      time = 2678400;
    } else if (time === "year"){
      time = 31536000;
    } else if (time === "lifetime"){
      time = 9999999999999999;
    } else{
      return interaction.reply("Please select a valid time from the options (day/week/month/year/lifetime)")
    }

    genned_keys = "";
    
    for (var i = 0; i < amount; i++){
      const key = await Keys.create({
        key_id: makeid(15),
        creation_time: Date.now(),
        creator: interaction.user.username + " | " + interaction.user.id,
        key_used: false,
        user: "",
        usage_time: 0,
        expires_in: time
      });

      genned_keys += " " + config.prefix + "-" + key.key_id; 
    }

    interaction.reply("Hey! I've DM'd you your keys!")
    interaction.channel.send("Please ensure the correct amount of keys have generated.")
    return interaction.user.send(genned_keys);
	} else if (commandName === 'redeem') {
    unstrippedKey = interaction.options.getString('key');
    key_id = unstrippedKey.replace(config.prefix + "-", "")

    console.log(key_id);

    const key = await Keys.findOne({ where: { key_id: key_id } });

    try {
      if(key.key_used != true){
        interaction.reply("Key redeemed successfully!")
        Keys.update({ key_used: true }, { where: { key_id: key_id } });
        Keys.update({ user: interaction.user.username + " | " + interaction.user.id, usage_time: Date.now()}, {where: { key_id: key_id }})
      
        if(config.action === 'sendFile'){
          interaction.channel.send("I have sent your file to your DMs.")
          interaction.user.send({files: [config.fileName]})
        } else if(config.action === 'giveRole'){
          let role = interaction.guild.roles.cache.find(r => r.id === config.giveRoleID);
          interaction.member.roles.add(role)
  
          const userExpiry = await Expire.create({ 
            user_id: interaction.user.id, 
            expires_at: Date.now() + key.expires_in
          })
        } else if(config.action === 'ownAction'){
          yourCode(interaction)
        }
      } else{
        interaction.reply("Key already redeemed OR key is invalid.")
      }
    } catch (error) {
      console.log(error);
    }
    
	}
});
// Login to Discord with your client's token

client.login(config.token);