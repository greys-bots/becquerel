require('dotenv').config();

const {
	Client,
	Intents,
	Options
} = require("discord.js");
const {
	FrameClient,
	Utilities,
	Handlers
} = require('frame');
const fs = require("fs");
const path = require("path");

const bot = new FrameClient({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.DIRECT_MESSAGES,
		Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
	],
	partials: [
		'MESSAGE',
		'USER',
		'CHANNEL',
		'GUILD_MEMBER',
		'REACTION'
	],
	makeCache: Options.cacheWithLimits({
		MessageManager: 0,
		ThreadManager: 0
	})
}, {
	prefix: process.env.PREFIX,
	invite: process.env.INVITE,
	statuses: [
		(bot) => `/help | in ${bot.guilds.cache.size} guilds!`,
		(bot) => `/help | serving ${bot.users.cache.size} users!`
	]
});

async function setup() {
	var { db, stores } = await Handlers.DatabaseHandler(bot, __dirname + '/stores');
	bot.db = db;
	bot.stores = stores;

	files = fs.readdirSync(__dirname + "/events");
	files.forEach(f => bot.on(f.slice(0,-3), (...args) => require(__dirname + "/events/"+f)(...args,bot)));

	bot.handlers = {};
	bot.handlers.interaction = Handlers.InteractionHandler(bot, __dirname + '/commands');
	files = fs.readdirSync(__dirname + "/handlers");
	for(var f of files) {
		var n = f.slice(0, -3);
		bot.handlers[n] = require(__dirname + "/handlers/"+f)(bot)
	}

	bot.utils = Utilities;
}

bot.writeLog = async (log) => {
	let now = new Date();
	let ndt = `${(now.getMonth() + 1).toString().length < 2 ? "0"+ (now.getMonth() + 1) : now.getMonth()+1}.${now.getDate().toString().length < 2 ? "0"+ now.getDate() : now.getDate()}.${now.getFullYear()}`;
	if(!fs.existsSync('./logs')) fs.mkdirSync('./logs');
	if(!fs.existsSync(`./logs/${ndt}.log`)){
		fs.writeFile(`./logs/${ndt}.log`,log+"\r\n",(err)=>{
			if(err) console.log(`Error while attempting to write log ${ndt}\n`+err.stack);
		});
	} else {
		fs.appendFile(`./logs/${ndt}.log`,log+"\r\n",(err)=>{
			if(err) console.log(`Error while attempting to apend to log ${ndt}\n`+err);
		});
	}
}

bot.on("ready", async ()=> {
	console.log(`Logged in as ${bot.user.tag} (${bot.user.id})`);
})

bot.on('error', (err)=> {
	console.log(`Error:\n${err.stack}`);
	bot.writeLog(`=====ERROR=====\r\nStack: ${err.stack}`)
})

process.on("unhandledRejection", (e) => console.log(e));

setup()
.then(async () => {
	try {
		await bot.login(process.env.TOKEN);
	} catch(e) {
		console.log("Trouble connecting...\n"+e)
	}
})
.catch(e => console.log(e))