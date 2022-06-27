const { Models: { DataStore, DataObject } } = require('frame');
const KEYS = {
	id: { },
	server_id: { },
	user_id: { },
	hid: { },
	answers: { },
	status: { patch: true },
	sent: { }
}

class Response extends DataObject {
	constructor(store, keys, data) {
		super(store, keys, data);
	}
}

class ResponseStore extends DataStore {
	#bot;
	#db;

	constructor(bot, db) {
		super(bot, db);
	}

	async init() {
		await this.db.query(`create table if not exists responses (
			id 			serial primary key,
			server_id 	text,
			user_id 	text,
			hid 		text,
			answers 	jsonb,
			status 		integer,
			sent 		timestamptz
		)`)
	}

	async create(data = {}) {
		try {
			var c = await this.db.query(`
				insert into responses (
					server_id,
					user_id,
					hid,
					answers,
					status,
					sent
				) values ($1, $2, find_unique('responses'), $3, $4, $5)
				returning *
			`, [data.server_id, data.user_id, data.answers,
				data.status ?? 0, data.sent || new Date()]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		return await this.getID(c.rows[0].id);
	}

	async get(server, hid) {
		try {
			var c = await this.db.query(`
				select * from responses
				where server_id = $1
				and hid = $2
			`, [server, hid])
		} catch(e) {
			console.log(e)
			return Promise.reject(e)
		}

		if(c.rows?.[0]) {
			return new Response(this, KEYS, c.rows[0]);
		} else return new Response(this, KEYS, { server_id: server })
	}

	async getID(id) {
		try {
			var c = await this.db.query(`
				select * from responses
				where id = $1
			`, [id])
		} catch(e) {
			console.log(e)
			return Promise.reject(e)
		}

		if(c.rows?.[0]) {
			return new Response(this, KEYS, c.rows[0]);
		} else return new Response(this, KEYS, { })
	}

	async getAll(server) {
		try {
			var c = await this.db.query(`
				select * from responses
				where server_id = $1
			`, [server])
		} catch(e) {
			console.log(e)
			return Promise.reject(e)
		}

		if(c.rows?.[0]) {
			return c.rows.map(r => new Response(this, KEYS, r));
		} else return undefined;
	}

	async update(id, data = {}) {
		try {
			await this.db.query(`UPDATE responses SET ${Object.keys(data).map((k, i) => k+"=$"+(i+2)).join(",")} WHERE id = $1`,[id, ...Object.values(data)]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}

		return await this.getID(id);
	}

	async delete(id) {
		try {
			await this.db.query(`DELETE FROM responses WHERE id = $1`, [id]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;
	}

	async deleteAll(server) {
		try {
			await this.db.query(`DELETE FROM responses WHERE server_id = $1`, [server]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;	
	}
}

module.exports = (bot, db) => new ResponseStore(bot, db);