import { promises as fsp } from 'fs'


class Collections {
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

	populate_children() {
		for(const task_id in this.tasks) {
			let task = this.tasks[task_id];

			if(task.parent_id) {
				this.branches[task.parent_id].child_ids.push(task_id);
			}
		}
	}

	to_json() {
		let table = []

		this.tasks.forEach((task_id) => {
			table.push(this.tasks[task_id].to_json())
		})
	}
}

class Task {
	constructor(datum, cost_code) {
		this.task_id = datum.task_id;
		this.parent_id = datum.task_branch;
		this.cost_code = `${cost_code}`;
		this.cost_code_aggregated = '';
		this.name = datum.task_name;
		this.description = datum.task_description;
	}

	calculate_cost_code(collections) {
		this.cost_code_aggregated = this.recurse_cost_codes(
			collections, this.cost_code, this
		);
	}

	recurse_cost_codes(collections, cost_code_aggregated, task) {
		if(task.parent_id) {
			let parent = collections.get_parent_by_id(task.parent_id);
			cost_code_aggregated = `${parent.cost_code}.${cost_code_aggregated}`
			return this.recurse_cost_codes(collections, cost_code_aggregated, parent)
		}
		return cost_code_aggregated;
	}

	to_json() {
		// Create and return an object populated with the appropriate properties. 
	}
}

class Branch extends Task {
	constructor(datum, cost_code) {
		super(datum, cost_code);
		this.branch_id = datum.idtasks_branches;
		this.total = 0; // `0` or `null`?
		this.child_ids = [];
	}

	calculate_total(collection) {
		this.total_z = this.recurse_total(collection, this.total, this); // change back to `total` from `total_z` when done testing.
	}

	recurse_total(collection, total, branch) {
		let costs = branch.child_ids.map((child_id) => { // remove branch
			let child = collection.tasks[child_id];
			if(child.constructor.name == 'Leaf') {
				return child.net;
			} else {
				return child.total;
			}
		})
		return costs;
	}
}

class Leaf extends Task {
	constructor(datum, cost_code) {
		super(datum, cost_code);
		this.leaf_id = datum.idtasks_leaves;
		this.quantity = datum.item_quantity;
		this.cost = datum.item_cost;
		this.tax = datum.item_tax;
		this.markup = datum.item_markup;
		this.net = (
			this.cost * this.quantity * (1 + this.tax) * (1 + this.markup)
		)
		this.stage = datum.task_stage;
		this.category = datum.idtask_categories;
	}
}

export const handler = async (data) => {
	const collections = new Collections();

	collections.import(data);
	collections.calculate_cost_codes();
	collections.calculate_totals();

	let pause;
}

async function json() {
	let json = await fsp.readFile(`tasks.json`, 'utf-8')
	return JSON.parse(json)
}

let data = await json()
if (data) handler(data)
