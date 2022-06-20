const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'create',
			description: "Create a new program",
			usage: [
				'- Open a modal to create a new program'
			]
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
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
				} 
			]
		}

		var m = await this.#bot.utils.awaitModal(ctx, mdata, ctx.user, false, 300000)
		if(!m) return "No data received.";
		var data = {};
		data.name = m.fields.getField('name').value.trim();
		data.description = m.fields.getField('description').value.trim();

	}
}

module.exports = (bot, stores) => new Command(bot, stores);