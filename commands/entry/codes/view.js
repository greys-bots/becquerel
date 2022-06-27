const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'view',
			description: "View available entry codes",
			options: [{
				name: 'code',
				description: 'The entry code to view',
				type: 3,
				required: false
			}],
			usage: [
				'- View all codes',
				'[code] - View a specific code'
			]
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var codes = await this.#stores.entryCodes.getAll(ctx.guild.id);
		if(!codes?.length) return 'No codes available.';
		var c = ctx.options.getString('code')?.trim().toLowerCase();
		if(c) codes = codes.filter(x => x.code == c);
		if(!codes.length) return 'Code not found.';

		return codes.map((x, i) => ({
			title: `Entry Code ${i+1}/${codes.length}`,
			description: x.code,
			fields: [
				{
					name: 'User',
					value: `<@${x.user_id}> (${x.user_id})`
				},
				{
					name: 'Uses',
					value: (x.uses ?? 0).toString()
				}
			]
		}))
	}
}

module.exports = (bot, stores) => new Command(bot, stores);