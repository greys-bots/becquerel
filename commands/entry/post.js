const { Models: { SlashCommand } } = require('frame');

class Command extends SlashCommand {
	#bot;
	#stores;

	constructor(bot, stores) {
		super({
			name: 'post',
			description: 'Post the entry embed',
			options: [{
				type: 7,
				name: 'channel',
				description: "The channel to post to",
				required: false,
				channel_types: [0, 5, 10, 11, 12]
			}],
			usage: [
				"[channel] - Post to the given channel",
				"- Post to the current channel"
			],
			ephemeral: true
		})
		this.#bot = bot;
		this.#stores = stores;
	}

	async execute(ctx) {
		var channel = ctx.options.getChannel('channel');
		if(!channel) channel = ctx.channel;
		var msg = await channel.send({
			embeds: [{
				title: "Entry application",
				description: "Interact below to fill out the application and enter the server.",
				color: 0x202020
			}],
			components: [{
				type: 1,
				components: [{
					type: 2,
					label: 'Apply',
					style: 1,
					custom_id: `entry`
				}]
			}]
		});

		try {
			await this.#stores.entryPosts.create({
				server_id: ctx.guild.id,
				channel_id: channel.id,
				message_id: msg.id
			})
		} catch(e) {
			return e.message;
		}

		return "Posted.";
	}
}

module.exports = (bot, stores) => new Command(bot, stores);