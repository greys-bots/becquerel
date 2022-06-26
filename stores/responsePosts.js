const { Models: { DataStore, DataObject } } = require('frame');
const KEYS = {
	id: { },
	server_id: { },
	channel_id: { },
	message_id: { },
	response: { }
}

class ResponsePost extends DataObject {
	constructor(store, keys, data) {
		super(store, keys, data);
	}

	async fetchResponse() {
		var resp = await this.store.bot.stores.responses.get(this.server_id, this.resp?.hid ?? this.response);
		this.resp = resp;
		return resp;
	}

	async handleInteraction(ctx) {
		if(ctx.user.bot) return;
		if(!ctx.member.permissions.has('MANAGE_MESSAGES')) return;

		if(!this.resp?.id) await this.fetchResponse();
		var config = await this.store.bot.stores.configs.get(this.server_id);

		var action = ctx.customId.replace('resp-', '');
		switch(action) {
			case 'accept':
				var dt = new Date();
				var embed = ctx.message.embeds[0];
				embed.color = 0x55aa55;
				embed.footer = { text: 'Response accepted.' };
				embed.timestamp = dt;

				try {
					this.resp.status = 1;
					this.resp = await this.resp.save();
					await ctx.message.edit({
						embeds: [embed],
						components: []
					})

					var user = await this.store.bot.users.fetch(this.user_id);
					await user.send({embeds: [{
						title: 'Response accepted.',
						description: `Your response in ${ctx.message.guild.name} has been accepted.`,
						color: 0x55aa55,
						timestamp: dt
					}]})

					if(config.role) {
						var member = await ctx.message.guild.members.fetch(user);
						await member.roles.add(config.role)
					}

					await this.delete();
				} catch(e) {
					console.log(e);
				}

				return;
			case 'deny':
				var modal = {
					title: 'Response denial',
					custom_id: 'deny',
					components: [{type: 1, components: [{
						type: 4,
						custom_id: 'reason',
						style: 2,
						label: 'Deny reason',
						placeholder:
							"Enter a reason to deny this response. " +
							"Leave blank for no reason",
						required: false,
						max_length: 1000,
						min_length: 0
					}]}]
				}

				var m = await this.bot.utils.awaitModal(ctx, modal, ctx.user, false, 300000)
				if(!m) return ctx.reply("Action cancelled.");
				var reason = m.fields.getField('reason').value.trim();
				
				var dt = new Date();
				var embed = ctx.message.embeds[0];
				embed.color = 0x55aa55;
				embed.footer = { text: 'Response denied.' };
				embed.timestamp = dt;

				try {
					this.resp.status = 2;
					this.resp = await this.resp.save();
					await ctx.message.edit({
						embeds: [embed],
						components: []
					})

					var user = await this.store.bot.users.fetch(this.user_id);
					await user.send({embeds: [{
						title: 'Response denied.',
						description:
							`Your response in ${ctx.message.guild.name} has been denied. Reason:\n` +
							(reason ?? '(no reason given)'),
						color: 0x55aa55,
						timestamp: dt
					}]})

					await this.delete();
				} catch(e) {
					console.log(e);
				}
				return;
			default:
				return;
		}
	}
}

class ResponsePostStore extends DataStore {
	constructor(bot, db) {
		super(bot, db)
	}

	async init() {
		await this.db.query(`create table if not exists response_posts (
			id 			serial primary key,
			server_id 	text,
			channel_id 	text,
			message_id 	text,
			response 	text
		)`)

		this.bot.on('interactionCreate', async (ctx) => {
			if(!ctx.isButton()) return;
			if(!ctx.customId.startsWith('resp-')) return;

			var post = await this.get(ctx.message.id);
			if(!post?.id) return;

			await post.handleInteraction(ctx);
		})
	}

	async create(data = {}) {
		try {
			var c = await this.db.query(`insert into response_posts (
				server_id,
				channel_id,
				message_id,
				response
			) values ($1, $2, $3, $4)
			returning id`,
			[data.server_id, data.channel_id, data.message_id, data.response])
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		return await this.getID(c.rows[0].id);
	}

	async get(message) {
		try {
			var data = await this.db.query(`select * from response_posts where message_id = $1`, [message]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		if(data.rows?.[0]) {
			var post = new ResponsePost(this, KEYS, data.rows[0]);
			var resp = await this.bot.stores.responses.get(post.server_id, post.response);
			post.resp = resp;
			return post;
		} else return new ResponsePost(this, KEYS, { });
	}

	async getByResponse(hid) {
		try {
			var data = await this.db.query(`select * from response_posts where response = $1`, [hid]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		if(data.rows?.[0]) return data.rows.map(p => new ResponsePost(this, KEYS, p));
		else return undefined;
	}

	async getID(id) {
		try {
			var data = await this.db.query(`select * from response_posts where id = $1`, [id]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		if(data.rows?.[0]) {
			var post = new ResponsePost(this, KEYS, data.rows[0]);
			var resp = await this.bot.stores.responses.get(post.server_id, post.response);
			post.response = resp;
			return post;
		} else return new ResponsePost(this, KEYS, { });
	}

	async update(id, data = {}) {
		try {
			await this.db.query(`UPDATE response_posts SET ${Object.keys(data).map((k, i) => k+"=$"+(i+2)).join(",")} WHERE id = $1`,[id, ...Object.values(data)]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}
	}

	async delete(id) {
		try {
			await this.db.query(`DELETE FROM response_posts WHERE id = $1`, [id]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;
	}

	async deleteAll(server) {
		try {
			await this.db.query(`DELETE FROM response_posts WHERE server_id = $1`, [server]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;
	}
}

module.exports = (bot, db) => new ResponsePostStore(bot, db);