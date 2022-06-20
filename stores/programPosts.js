const { Models: { DataStore, DataObject } } = require('frame');
const KEYS = {
	id: { },
	server_id: { },
	channel_id: { },
	message_id: { },
	program: { }
}

class ProgramPost extends DataObject {
	#store;

	constructor(store, keys, data) {
		super(store, keys, data);
		this.#store;
	}

	async fetchProgram() {
		var prog = await this.#store.bot.stores.programs.get(this.server_id, this.prog?.hid ?? this.program);
		this.prog = prog;
		return prog;
	}

	async handleInteraction(ctx) {
		if(ctx.user.bot) return;

		if(!this.prog?.id) await this.fetchProgram();
		if(!this.prog.open)
			return await ctx.reply({ ephemeral: true, content: `That program is no longer open.` });
		var cfg = await this.#store.bot.stores.configs.get(this.server_id);
		if(cfg.role && !ctx.member.roles.has(cfg.role)) {
			return await ctx.reply({
				content: "You don't have permission to enter programs in this server.",
				ephemeral: true
			})
		}

		if(ctx.member.roles.has(this.prog.role)) {
			await ctx.member.roles.remove(this.prog.role);
			return await ctx.reply({
				content: "You have been removed from the program.",
				ephemeral: true
			});
		} else {
			await ctx.member.roles.add(this.prog.role);
			return await ctx.reply({
				content: "You have been added to the program.",
				ephemeral: true
			});
		}
	}
}

class ProgramPostStore extends DataStore {
	bot;
	#db;

	constructor(bot, db) {
		super()
		this.bot = bot;
		this.#db = db;
	}

	async init() {
		await this.#db.query(`create table if not exists program_posts (
			id 			serial primary key,
			server_id 	text,
			channel_id 	text,
			message_id 	text,
			program 	text
		)`)
	}

	async create(data = {}) {
		try {
			var c = await this.#db.query(`insert into program_posts (
				server_id,
				channel_id,
				message_id,
				program
			) values ($1, $2, $3, $4)
			returning id`,
			[data.server_id, data.channel_id, data.message_id, data.program])
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		return await this.getID(c.rows[0].id);
	}

	async get(message) {
		try {
			var data = await this.#db.query(`select * from program_posts where message_id = $1`, [message]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		if(data.rows?.[0]) {
			var post = new ProgramPost(this, KEYS, data.rows[0]);
			var prog = await this.bot.stores.programs.get(post.server_id, post.program);
			post.prog = prog;
			return post;
		} else return new ProgramPost(this, KEYS, { });
	}

	async getByProgram(hid) {
		try {
			var data = await this.#db.query(`select * from program_posts where program = $1`, [hid]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		if(data.rows?.[0]) return data.rows.map(p => new ProgramPost(this, KEYS, p));
		else return undefined;
	}

	async getID(id) {
		try {
			var data = await this.#db.query(`select * from program_posts where id = $1`, [id]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		if(data.rows?.[0]) {
			var post = new ProgramPost(this, KEYS, data.rows[0]);
			var prog = await this.bot.stores.programs.get(post.server_id, post.program);
			post.program = prog;
			return post;
		} else return new ProgramPost(this, KEYS, { });
	}

	async update(id, data = {}) {
		try {
			await this.#db.query(`UPDATE program_posts SET ${Object.keys(data).map((k, i) => k+"=$"+(i+2)).join(",")} WHERE id = $1`,[id, ...Object.values(data)]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}
	}

	async delete(id) {
		try {
			await this.#db.query(`DELETE FROM program_posts WHERE id = $1`, [id]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;
	}

	async deleteAll(server) {
		try {
			await this.#db.query(`DELETE FROM program_posts WHERE server_id = $1`, [server]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;
	}

	async updatePosts(server, program) {
		var prog = await this.bot.stores.programs.get(server, program);
		if(!prog?.id) return;

		var posts = await this.getByProgram(prog.hid);
		if(!posts?.length) return;

		var guild = await this.bot.guilds.fetch(prog.server_id);
		if(!guild) return;

		var channels = {};
		var errors = [];
		for(var post of posts) {
			try {
				var ch = channels[post.channel_id];
				if(!ch) ch = await guild.channels.fetch(post.channel_id);
				var msg = await ch.messages.fetch(post.message_id);
				var color;
				if(prog.end.getTime() < new Date().getTime()) color = 0xaa5555;
				else if(prog.color) color = parseInt(prog.color, 16);
				else color = 0x202020;

				await msg.edit({embeds: [{
					title: prog.name,
					description: prog.description,
					color,
					footer: { text: `Interact below to enter or exit the program.` }
				}]})
			} catch(e) {
				errors.push(
					`Channel: ${post.channel_id}\n` +
					`Message: ${post.message_id}\n` +
					`Error: ${e.message}`
				)
				continue;
			}
		}
	}
}

module.exports = (bot, db) => new ProgramPostStore(bot, db);