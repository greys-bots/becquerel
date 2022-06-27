const { Models: { DataStore, DataObject } } = require('frame');
const KEYS = {
	id: { },
	server_id: { },
	channel_id: { },
	message_id: { },
	entry: { }
}

const modal = {
	title: 'Entry application',
	custom_id: 'entry',
	components: [
		{
			type: 1, components: [{
				type: 4,
				custom_id: 'supporter',
				style: 1,
				label: 'Are you one of our supporters?',
				placeholder:
					`If so, enter your username and where you support us`,
				required: false,
				max_length: 100,
				min_length: 2
			}]
		},
		{
			type: 1, components: [{
				type: 4,
				custom_id: 'code',
				style: 1,
				label: `Enter your entry code if you said "no" above`,
				required: false,
				max_length: 100,
				min_length: 0
			}]
		}
	]
}

class EntryPost extends DataObject {
	constructor(store, keys, data) {
		super(store, keys, data);
	}

	async handleInteraction(ctx) {
		if(ctx.user.bot) return;
		var cfg = await this.store.bot.stores.configs.get(ctx.guild.id);
		if(!cfg?.responses) return await ctx.reply({
			content: "No response channel set. Ask a mod to fix this.",
			ephemeral: true
		})

		var channel = await ctx.guild.channels.fetch(cfg.responses);

		var m = await this.store.bot.utils.awaitModal(ctx, modal, ctx.user, true, 300000);
		if(!m) return;
		var answers = m.components.reduce((p, n) => p.concat(n.components), [])
			.map(c => c.value);
		var questions = modal.components.reduce((p,n) => p.concat(n.components), [])
			.map(c => c.label);

		var response = await this.store.bot.stores.responses.create({
			server_id: this.server_id,
			user_id: ctx.user.id,
			answers: JSON.stringify(answers)
		})

		var footer = { text: 'No entry code given.' }
		if(answers[1]?.length) {
			var code = await this.store.bot.stores.entryCodes.get(this.server_id, answers[1]);
			if(!code?.id) footer.text = 'Entry code invalid.';
			else footer.text = 'Entry code is valid.'
		}

		var msg = await channel.send({
			embeds: [{
				title: 'Response received',
				description: `User: ${ctx.user} (${ctx.user.tag} / ${ctx.user.id})`,
				fields: questions.map((q,i) => ({
					name: q,
					value: answers[i] || "(no response)"
				})),
				footer
			}],
			components: [{type: 1, components: [
				{
					type: 2,
					custom_id: 'resp-accept',
					label: 'Accept',
					style: 3,
				},
				{
					type: 2,
					custom_id: 'resp-deny',
					label: 'Deny',
					style: 4
				}
			]}]
		})

		await this.store.bot.stores.responsePosts.create({
			server_id: msg.guild.id,
			channel_id: msg.channel.id,
			message_id: msg.id,
			response: response.hid
		})

		return await m.followUp('Response received.')
	}
}

class EntryPostStore extends DataStore {
	constructor(bot, db) {
		super(bot, db)
	}

	async init() {
		await this.db.query(`create table if not exists entry_posts (
			id 			serial primary key,
			server_id 	text,
			channel_id 	text,
			message_id 	text
		)`)

		this.bot.on('interactionCreate', async (ctx) => {
			if(!ctx.isButton()) return;
			if(ctx.customId !== 'entry') return;

			var post = await this.get(ctx.message.id);
			if(!post?.id) return;

			await post.handleInteraction(ctx);
		})
	}

	async create(data = {}) {
		try {
			var c = await this.db.query(`insert into entry_posts (
				server_id,
				channel_id,
				message_id
			) values ($1, $2, $3)
			returning id`,
			[data.server_id, data.channel_id, data.message_id])
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		return await this.getID(c.rows[0].id);
	}

	async get(message) {
		try {
			var data = await this.db.query(`select * from entry_posts where message_id = $1`, [message]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		if(data.rows?.[0]) {
			return new EntryPost(this, KEYS, data.rows[0]);
		} else return new EntryPost(this, KEYS, { });
	}

	async getID(id) {
		try {
			var data = await this.db.query(`select * from entry_posts where id = $1`, [id]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		if(data.rows?.[0]) {
			return new EntryPost(this, KEYS, data.rows[0]);
		} else return new EntryPost(this, KEYS, { });
	}

	async update(id, data = {}) {
		try {
			await this.db.query(`UPDATE entry_posts SET ${Object.keys(data).map((k, i) => k+"=$"+(i+2)).join(",")} WHERE id = $1`,[id, ...Object.values(data)]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}
	}

	async delete(id) {
		try {
			await this.db.query(`DELETE FROM entry_posts WHERE id = $1`, [id]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;
	}

	async deleteAll(server) {
		try {
			await this.db.query(`DELETE FROM entry_posts WHERE server_id = $1`, [server]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;
	}
}

module.exports = (bot, db) => new EntryPostStore(bot, db);