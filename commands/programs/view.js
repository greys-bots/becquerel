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

		var embeds = [];
		if(id) {
			var prog = await this.#stores.programs.get(ctx.guild.id, id);
			if(!prog?.id) return "Program not found.";

			var color;
			if(!prog.open) color = 0xaa5555;
			else if(prog.color) color = parseInt(prog.color, 16);
			else color = 0x202020;
			embeds.push({
				title: prog.name,
				description: prog.description,
				color,
				fields: [
					{
						name: 'Role',
						value: `<@&${prog.role}>`
					},
					{
						name: 'Bot',
						value: `<@${prog.bot_id}>`
					}
				]
			})
		} else {
			var progs = await this.#stores.programs.getAll(ctx.guild.id);
			if(!progs?.length) return "No programs created.";

			embeds = progs.map(prog => {
				var color;
				if(!prog.open) color = 0xaa5555;
				else if(prog.color) color = parseInt(prog.color, 16);
				else color = 0x202020;

				return {
					title: prog.name,
					description: prog.description,
					color,
					fields: [
						{
							name: 'Role',
							value: `<@&${prog.role}>`
						},
						{
							name: 'Bot',
							value: `<@${prog.bot_id}>`
						}
					]
				}
			})
		}

		if(embeds.length > 1) for (var i = 0; i < embeds.length; i++)
			embeds[i].title += ` (page ${i+1}/${embeds.length})`;

		return embeds;
	}

	async auto(ctx) {
		var programs = await ctx.client.stores.programs.getAll(ctx.guild.id);
		var foc = ctx.options.getFocused();
		if(!foc) return programs.map(p => ({ name: p.name, value: p.hid }));
		foc = foc.toLowerCase()

		if(!programs?.length) return [];

		return programs.filter(p =>
			p.hid.includes(foc) ||
			p.name.toLowerCase().includes(foc) ||
			p.description.toLowerCase().includes(foc)
		).map(p => ({
			name: p.name,
			value: p.hid
		}))
	}
}

module.exports = (bot, stores) => new Command(bot, stores);