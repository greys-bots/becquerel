const { Models: { SlashCommand } } = require('frame');
const tc = require('tinycolor2');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'create',
			description: "Create a new program",
			options: [
				{
					type: 8,
					name: 'role',
					description: "The role to associate with the program",
					required: true
				},
				{
					type: 6,
					name: 'bot',
					description: "The bot to associate with the program",
					required: true
				}
			],
			usage: [
				'[role] - Open a modal to create a new program'
			]
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var role = ctx.options.getRole('role').id;
		var bot_id = ctx.options.getUser('bot').id;
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
						required: true
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
						required: true
					}]
				},
				{
					type: 1,
					components: [{
						type: 4,
						custom_id: 'tests',
						label: 'Current tests',
						style: 2,
						min_length: 1,
						max_length: 2048,
						placeholder: 'What this beta is testing',
						required: true
					}]
				},
				{
					type: 1,
					components: [{
						type: 4,
						custom_id: 'color',
						label: 'Color',
						style: 1,
						min_length: 1,
						max_length: 20,
						placeholder: 'Hex code or valid color name',
						required: false
					}]
				}
			]
		}

		var m = await this.#bot.utils.awaitModal(ctx, mdata, ctx.user, false, 300000)
		if(!m) return "No data received.";
		var data = { role, bot_id, server_id: ctx.guild.id };
		data.name = m.fields.getField('name').value.trim();
		data.description = m.fields.getField('description').value.trim();
		data.tests = m.fields.getField('tests').value.trim();
		var color = m.fields.getField('color').value?.trim();
		if(color?.length) {
			color = tc(color);
			if(!color.isValid()) return "Invalid color given.";
			data.color = color.toHex();
		}

		try {
			var prog = await this.#stores.programs.create(data);
		} catch(e) {
			return e.message;
		}

		return `Program created. ID: ${prog.hid}`;
	}
}

module.exports = (bot, stores) => new Command(bot, stores);