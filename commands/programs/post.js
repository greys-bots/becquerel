const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'post',
			description: "Post a program to a channel",
			options: [
				{
					type: 3,
					name: 'program',
					description: "The program to post",
					required: true,
					autocomplete: true
				},
				{
					type: 7,
					name: 'channel',
					description: "The channel to post to",
					required: false,
					channel_types: [0, 5, 10, 11, 12]
				}
			],
			usage: [
				'[program] - Post a program to the current channel',
				'[program] [channel] - Post a program to the given channel'
			],
			ephemeral: true
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var id = ctx.options.getString('program').trim().toLowerCase();
		var channel = ctx.options.getChannel('channel');

		var program = await this.#stores.programs.get(ctx.guild.id, id);
		if(!program?.id) return "Program not found.";

		if(!channel) channel = ctx.channel;

		var color;
		if(!program.open) color = 0xaa5555;
		else if(program.color) color = parseInt(program.color, 16);
		else color = 0x202020;
		var msg = await channel.send({
			embeds: [{
				title: program.name,
				description: program.description,
				color,
				footer: {
					text: 'Interact below to enter or exit the program.'
				}
			}],
			components: [{
				type: 1,
				components: [{
					type: 2,
					label: 'Enter/Exit',
					style: 1,
					custom_id: `prog-${program.hid}`
				}]
			}]
		});

		try {
			await this.#stores.programPosts.create({
				server_id: ctx.guild.id,
				channel_id: channel.id,
				message_id: msg.id,
				program: program.hid
			})
		} catch(e) {
			return e.message;
		}

		return "Posted.";
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