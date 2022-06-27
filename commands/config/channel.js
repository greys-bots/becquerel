const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'channel',
			description: 'Set where to send entry responses',
			options: [{
				type: 7,
				name: 'channel',
				description: "The channel to post responses to",
				required: true,
				channel_types: [0, 5, 10, 11, 12]
			}],
			usage: [
				"[channel] - Post to the given channel"
			],
			ephemeral: true
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var channel = ctx.options.getChannel('channel');
		var cfg = await this.#stores.configs.get(ctx.guild.id);

		try {
			cfg.responses = channel.id;
			await cfg.save()
		} catch(e) {
			return e.message;
		}

		return "Config set.";
	}
}

module.exports = (bot, stores) => new Command(bot, stores);