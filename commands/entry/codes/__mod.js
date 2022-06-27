const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'codes',
			description: "Commands for managing entry codes",
			guildOnly: true,
			permissions: ['MANAGE_MESSAGES'],
			type: 2
		})
		this.#bot = bot;
		this.#stores = stores;
	}
}

module.exports = (bot, stores) => new Command(bot, stores);