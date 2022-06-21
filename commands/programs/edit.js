const { Models: { SlashCommand } } = require('frame');
const tc = require('tinycolor2')

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'edit',
			description: "Change the name or description of a program",
			options: [{
				type: 3,
				name: 'program',
				description: "The program to change",
				required: true,
				autocomplete: true
			}],
			usage: [
				"[program] - Open a modal to change the program's details"
			]
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var id = ctx.options.getString('program').trim().toLowerCase();
		var program = await this.#stores.programs.get(ctx.guild.id, id);
		if(!program?.id) return "Program not found.";

		var mdata = {
			custom_id: `program-create-${ctx.user.id}`,
			title: "Create a program",
			components: [
				{
					type: 1,
					components: [{
						type: 4,
						custom_id: 'name',
						label: 'Name',
						style: 1,
						min_length: 1,
						max_length: 100,
						placeholder: 'Program name',
						required: true,
						value: program.name
					}]
				},
				{
					type: 1,
					components: [{
						type: 4,
						custom_id: 'description',
						label: 'Description',
						style: 2,
						min_length: 1,
						max_length: 4000,
						placeholder: 'Program description',
						required: true,
						value: program.description
					}]
				},
				{
					type: 1,
					components: [{
						type: 4,
						custom_id: 'color',
						label: 'Color',
						style: 1,
						min_length: 3,
						max_length: 6,
						placeholder: 'Hex code or valid color name. Default: #202020',
						required: false,
						value: program.color
					}]
				},
			]
		}

		var m = await this.#bot.utils.awaitModal(ctx, mdata, ctx.user, false, 300000)
		if(!m) return "No data received.";
		program.name = m.fields.getField('name').value.trim();
		program.description = m.fields.getField('description').value.trim();
		var color = m.fields.getField('color').value?.trim();
		if(color?.length) {
			color = tc(color);
			if(!color.isValid()) return "Invalid color given.";
			program.color = color.toHex();
		}

		try {
			await program.save();
			await this.#stores.programPosts.updatePosts(ctx.guild.id, program.hid);
		} catch(e) {
			return e.message ?? e.join("\n\n");
		}

		return `Program updated.`;
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