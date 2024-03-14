import { promises as fsp } from 'fs'


class Collection {
	constructor() {
		this.tasks = {};
		this.branches = {};
		this.leaves = {};
	}

	import(data) {
		const first_key = Object.keys(data)[0];
		const first_value_length = data[first_key].length;

		for (let i = 0; i < first_value_length; i++) {
			let datum = {};
			for(const property in data) {
				datum[property] = data[property][i];
			}
			this.add(datum);
		}
	}

	add(datum) {
		let task, cost_code, task_id;

		if(datum.branch_cost_code) {
			cost_code = datum.branch_cost_code;
			task = new Branch(datum, cost_code);
			this.branches[task.branch_id] = task
		} else if(datum.task_cost_code) {
			cost_code = datum.task_cost_code;
			task = new Leaf(datum, cost_code);
			this.leaves[task.leaf_id] = task
		} else {
			console.err('Error: Task was not type "Branch" nor "Leaf".');
		}

		task_id = datum.task_id;
		this.tasks[task_id] = task;
	}

	get_parent_by_id(id) {
		let branch = this.branches[id];
		return branch;
	}

	calculate_cost_codes() {
		for(const task_id in this.tasks) {
			this.tasks[task_id].calculate_cost_code(this);
		}
	}

	calculate_totals() {
		this.populate_children();

		for(const branch_id in this.branches) {
			this.branches[branch_id].calculate_total(this);
		}
	}

	indent_names() {
		for(const task_id in this.tasks) {
			this.tasks[task_id].indent_name();
		}
	}

	populate_children() {
		for(const task_id in this.tasks) {
			let task = this.tasks[task_id];

			if(task.parent_id) {
				this.branches[task.parent_id].child_ids.push(task_id);
			}
		}
	}

	to_json() {
		let table = [];

		for(const task_id in this.tasks) {
			table.push(this.tasks[task_id].to_json());
		}

		return table;
	}
}

class Task {
	static INDENTOR = '=';

	constructor(datum, cost_code) {
		this.task_id = datum.task_id;
		this.type = null;
		this.parent_id = datum.task_branch;
		this.cost_code = `${cost_code}`;
		this.cost_code_aggregated = '';
		this.name = datum.task_name;
		this.description = datum.task_description;
	}

	calculate_cost_code(collection) {
		this.cost_code_aggregated = this.recurse_cost_codes(
			collection, this.cost_code, this
		);
	}

	recurse_cost_codes(collection, cost_code_aggregated, task) {
		if(task.parent_id) {
			let parent = collection.get_parent_by_id(task.parent_id);
			cost_code_aggregated = `${parent.cost_code}.${cost_code_aggregated}`
			return this.recurse_cost_codes(collection, cost_code_aggregated, parent)
		}
		return cost_code_aggregated;
	}

	indent_name() {
		let name = '';
		let levels = (this.cost_code_aggregated.match(/\./g) || []).length;
		while(0 < levels) {
			name += Task.INDENTOR;
			levels--;
		}
		this.name = `${name}> ${this.name}`;
	}

	to_json() {
		let usd = new Intl.NumberFormat(
			'en-us', {style: 'currency', currency: 'USD'}
		)
		let json = {};

		json.type = this.type;
		json.code = this.cost_code_aggregated;
		json.name = this.name;
		json.description = this.description;
		json.qty = this.quantity || '';
		json.cost = this.cost_aggregated || '';
		json.net = this.net || this.total;

		if(json.cost) json.cost = usd.format(json.cost);
		if(json.net) json.net = usd.format(json.net);

		return json;
	}
}

class Branch extends Task {
	constructor(datum, cost_code) {
		super(datum, cost_code);
		this.type = 'branch';
		this.branch_id = datum.idtasks_branches;
		this.total = 0;
		this.child_ids = [];
	}

	calculate_total(collection) {
		this.total = this.recurse_total(collection, this.total, this);
	}

	recurse_total(collection, total, branch) {
		let costs = branch.child_ids.map((child_id) => {
			let child = collection.tasks[child_id];
			if(child.constructor.name == 'Leaf') {
				return child.net;
			} else {
				total += child.total;
				return this.recurse_total(collection, total, child);
			}
		})
		.reduce((acc, total) => acc.concat(total), [])
		.reduce((acc, total) => acc + total, 0);
		return costs;
	}
}

class Leaf extends Task {
	constructor(datum, cost_code) {
		super(datum, cost_code);
		this.type = 'leaf';
		this.leaf_id = datum.idtasks_leaves;
		this.quantity = datum.item_quantity;
		this.cost = datum.item_cost;
		this.tax = datum.item_tax;
		this.markup = datum.item_markup;
		this.cost_aggregated = this.cost * (1 + this.tax) * (1 + this.markup);
		this.net = (
			this.cost * this.quantity * (1 + this.tax) * (1 + this.markup)
		)
		this.stage = datum.task_stage;
		this.category = datum.idtask_categories;
	}
}

function handler(data) {
	let json;
	const collection = new Collection();

	collection.import(data);
	collection.calculate_cost_codes();
	collection.indent_names();
	collection.calculate_totals();
	
	json = collection.to_json();
	json.sort((a, b) => {
		return a.code.localeCompare(b.code)
	})

	return json;
}

async function json() {
	let json = await fsp.readFile(`tasks.json`, 'utf-8')
	return JSON.parse(json)
}

// let data = handler({{fetchAllProjectTasks.data}});
// return data;

let data = await json()
if (data) handler(data)
