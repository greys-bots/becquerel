const { Models: { DataStore, DataObject } } = require('frame');
const KEYS = {
	id: { },
	server_id: { },
	user_id: { },
	code: { },
	uses: { patch: true }
}

class EntryCode extends DataObject {
	constructor(store, keys, data) {
		super(store, keys, data)
	}
}

class EntryCodeStore extends DataStore {
	constructor(bot, db) {
		super(bot, db);
	}

	async init() {
		await this.db.query(`
			CREATE TABLE IF NOT EXISTS entry_codes (
				id 			SERIAL PRIMARY KEY,
				server_id	TEXT,
				user_id 	TEXT,
				code 		TEXT,
				uses 		INTEGER
			);

			CREATE OR REPLACE FUNCTION gen_code() RETURNS TEXT AS
				'select lower(substr(md5(random()::text), 0, 10));'
			LANGUAGE SQL VOLATILE;

			CREATE OR REPLACE FUNCTION find_code() RETURNS TEXT AS $$
				DECLARE nhid TEXT;
				DECLARE res BOOL;
				BEGIN
					LOOP
						nhid := gen_code();
						EXECUTE format(
							'SELECT (EXISTS (
								SELECT FROM entry_codes
								WHERE code = %L
							))::bool',
							nhid
						) INTO res;
						IF NOT res THEN RETURN nhid; END IF;
					END LOOP;
				END
			$$ LANGUAGE PLPGSQL VOLATILE;
		`)
	}

	async create(data = {}) {
		try {
			var c = await this.db.query(`INSERT INTO entry_codes (
				server_id,
				user_id,
				code,
				uses
			) VALUES ($1, $2, find_code(), $3)
			RETURNING *`,
			[data.server_id, data.user_id, data.uses ?? 0]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		return await this.getID(c.rows[0].id);
	}

	async get(server, code) {
		try {
			var data = await this.db.query(`select * from entry_codes
				where server_id = $1 and code = $2
			`, [server, code]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		if(data.rows?.[0]) return new EntryCode(this, KEYS, data.rows[0]);
		else return new EntryCode(this, KEYS, { server_id: server });
	}

	async getID(id) {
		try {
			var data = await this.db.query(`select * from entry_codes
				where id = $1
			`, [id]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		if(data.rows?.[0]) return new EntryCode(this, KEYS, data.rows[0]);
		else return new EntryCode(this, KEYS, { });
	}

	async getAll(server) {
		try {
			var data = await this.db.query(`select * from entry_codes where server_id = $1`, [server]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}

		if(data.rows?.[0]) {
			return data.rows.map(p => new EntryCode(this, KEYS, p));
		} else return undefined;
	}

	async update(id, data = {}) {
		try {
			await this.db.query(`UPDATE entry_codes SET ${Object.keys(data).map((k, i) => k+"=$"+(i+2)).join(",")} WHERE id = $1`,[id, ...Object.values(data)]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}

		return await this.getID(id);
	}

	async delete(id) {
		try {
			await this.db.query(`DELETE FROM entry_codes WHERE id = $1`, [id]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;
	}

	async deleteAll(server) {
		try {
			await this.db.query(`DELETE FROM entry_codes WHERE server_id = $1`, [server]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}
		
		return;
	}
}

module.exports = (bot, db) => new EntryCodeStore(bot, db);