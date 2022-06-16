const { Models: { DataStore, DataObject } } = require('frame');
const KEYS = {
	id: { },
	server_id: { },
	bot_id: { },
	name: { patch: true },
	description: { patch: true },
	color: { patch: true },
	start: { patch: true },
	end: { patch: true }
}

class Program extends DataObject {
	#store;

	constructor(store, keys, data) {
		super(store, keys, data)
		this.#store = store;
	}
}

class ProgramStore extends DataStore {
	#bot;
	#db;

	constructor(bot, db) {
		super();

		this.#bot = bot;
		this.#db = db;
	}

	async init() {
		
	}

	async create() {
		
	}

	async get() {
		
	}

	async getID() {
		
	}

	async update() {
		
	}

	async delete() {
		
	}

	async deleteAll() {
		
	}
}