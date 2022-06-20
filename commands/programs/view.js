const { Models: { SlashCommand }} = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'view',
			description: "View available programs",
			options: [{
				name: 'program',
				description: "A program to view",
				type: 3,
				required: false,
				autocomplete: true
			}],
			usage: [
				"- View all programs",
				"[program] - View a specific program"
			],
			ephemeral: true
		})

		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var id = ctx.options.getString('program')?.toLowerCase().trim();

		if(id) {
			var prog = await this.#stores.programs.get(ctx.guild.id, id);
			if(!prog?.id) return "Program not found.";
		}
	}
}

module.exports = (bot, stores) => new Command(bot, stores);