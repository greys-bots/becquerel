const { Models: { DataStore, DataObject } } = require('frame');
const KEYS = {
	id: { },
	server_id: { },
	bot_id: { },
	hid: { },
	name: { patch: true },
	description: { patch: true },
	tests: { patch: true },
	color: { patch: true },
	role: { patch: true },
	open: { patch: true },
	start: { patch: true },
	ended: { patch: true }
}

class Program extends DataObject {
	constructor(store, keys, data) {
		super(store, keys, data)
	}
}

class ProgramStore extends DataStore {
	constructor(bot, db) {
		super(bot, db);
	}

	async init() {
		await this.db.query(`CREATE TABLE IF NOT EXISTS programs(
			id 			SERIAL PRIMARY KEY,
			server_id	TEXT,
			bot_id		TEXT,
			hid			TEXT,
			name 		TEXT,
			description	TEXT,
			tests 		TEXT,
			color		TEXT,
			role 		TEXT,
			open 		BOOLEAN,
			start		TIMESTAMPTZ,
			ended 		TIMESTAMPTZ
		)`)
	}

	async create(data = {}) {
		try {
			var c = await this.db.query(`INSERT INTO programs (
				server_id,
				bot_id,
				hid,
				name,
				description,
				tests,
				color,
				role,
				open,
				start,
				ended
			) VALUES ($1, $2, find_unique('programs'), $3, $4, $5, $6, $7, $8, $9, $10)
			RETURNING *`,
			[data.server_id, data.bot_id, data.name,
			  data.description, data.tests, data.color, data.role, data.open ?? true,
			  data.start || new Date(), data.end]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		return await this.getID(c.rows[0].id);
	}

	async get(server, hid) {
		try {
			var data = await this.db.query(`select * from programs
				where server_id = $1 and hid = $2
			`, [server, hid]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		if(data.rows?.[0]) return new Program(this, KEYS, data.rows[0]);
		else return new Program(this, KEYS, { server_id: server });
	}

	async getID(id) {
		try {
			var data = await this.db.query(`select * from programs
				where id = $1
			`, [id]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		if(data.rows?.[0]) return new Program(this, KEYS, data.rows[0]);
		else return new Program(this, KEYS, { });
	}

	async getAll(server) {
		try {
			var data = await this.db.query(`select * from programs where server_id = $1`, [server]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		if(data.rows?.[0]) {
			return data.rows.map(p => new Program(this, KEYS, p));
		} else return undefined;
	}

	async update(id, data = {}) {
		try {
			await this.db.query(`UPDATE programs SET ${Object.keys(data).map((k, i) => k+"=$"+(i+2)).join(",")} WHERE id = $1`,[id, ...Object.values(data)]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}

		return await this.getID(id);
	}

	async delete(id) {
		try {
			await this.db.query(`DELETE FROM programs WHERE id = $1`, [id]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;
	}

	async deleteAll(server) {
		try {
			await this.db.query(`DELETE FROM programs WHERE server_id = $1`, [server]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;
	}
}

module.exports = (bot, db) => new ProgramStore(bot, db);