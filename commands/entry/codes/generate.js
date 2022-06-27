const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'generate',
			description: "Generate a new entry code",
			options: [{
				type: 6,
				name: 'user',
				description: "The user to associate this code with",
				required: true
			}],
			usage: [
				'[user] - Generate a new code and associate it with a user'
			]
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var user = ctx.options.getUser('user');

		try {
			var code = await this.#stores.entryCodes.create({
				server_id: ctx.guild.id,
				user_id: user.id
			})
		} catch(e) {
			return e.message;
		}

		return `Code generated: ${code.code}`;
	}
}

module.exports = (bot, stores) => new Command(bot, stores);