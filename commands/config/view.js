const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'view',
			description: "View the current config",
			usage: [
				'- Views the current config'
			],
			ephemeral: true
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var config = await this.#stores.configs.get(ctx.guild.id);
		if(!config?.id) return 'No config set up.';

		return {embeds: [{
			title: 'Config',
			fields: [
				{
					name: 'Response channel',
					value: config.responses ? `<#${config.responses}>` : '(not set)'
				},
				{
					name: 'Testing role',
					value: config.role ? `<@&${config.role}>` : '(not set)'
				},
			]
		}]}
	}
}

module.exports = (bot, stores) => new Command(bot, stores);