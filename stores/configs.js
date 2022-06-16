const { Models: { DataStore, DataObject } } = require('frame');
const KEYS = {
	id: { },
	server_id: { },
	responses: { patch: true },
	roles: { patch: true }
}

class Config extends DataObject {
	#store;

	constructor(store, keys, data) {
		super(store, keys, data);

		this.#store = store;
	}
}

class ConfigStore extends DataStore {
	#bot;
	#db;

	constructor (bot, db) {
		super();
		this.#bot = bot;
		this.#db = db;
	}

	async init() {
		await this.#db.query(`create table if not exists configs (
			id			serial primary key,
			server_id	text,
			responses	text,
			roles		text[]
		)`)
	}

	async create(data = {}) {
		try {
			var c = await this.#db.query(`INSERT INTO configs (
				server_id,
				responses,
				roles
			) VALUES ($1,$2,$3)
			RETURNING *`,
			[data.server_id, data.responses, data.roles]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e)
		}

		return await this.getID(c.rows[0].id)
	}

	async get(server) {
		try {
			var c = await this.#db.query(`
				select * from configs where
				server_id = $1
			`, [server])
		} catch(e) {
			console.log(e);
			return Promise.reject(e)
		}

		if(c.rows?.[0]) {
			return new Config(this, KEYS, c.rows[0]);
		} else return new Config(this, KEYS, { server_id: server })
	}

	async getID(id) {
		try {
			var c = await this.#db.query(`
				select * from configs where
				id = $1
			`, [id])
		} catch(e) {
			console.log(e);
			return Promise.reject(e)
		}

		if(c.rows?.[0]) {
			return new Config(this, KEYS, c.rows[0]);
		} else return new Config(this, KEYS, { })
	}

	async update(id, data = {}) {
		try {
			await this.#db.query(`UPDATE configs SET ${Object.keys(data).map((k, i) => k+"=$"+(i+2)).join(",")} WHERE id = $1`,[id, ...Object.values(data)]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}

		return await this.getID(id);
	}

	async delete(id) {
		try {
			await this.#db.query(`DELETE FROM configs WHERE id = $1`, [id]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;
	}
}