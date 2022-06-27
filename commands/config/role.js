const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'role',
			description: 'Set the server entry role',
			options: [{
				type: 8,
				name: 'role',
				description: "The role to set",
				required: true,
				channel_types: [0, 5, 10, 11, 12]
			}],
			usage: [
				"[role] - Set the entry role"
			],
			ephemeral: true
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var role = ctx.options.getRole('role');
		var cfg = await this.#stores.configs.get(ctx.guild.id);

		try {
			cfg.role = role.id;
			await cfg.save()
		} catch(e) {
			return e.message;
		}

		return "Config set.";
	}
}

module.exports = (bot, stores) => new Command(bot, stores);