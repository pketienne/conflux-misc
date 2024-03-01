import { promises as fsp } from 'fs'

class TasksCollection {
	constructor() {
		this.collection = {};
		this.branches_index = {};
		this.leaves_index = {};
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
		let task, cost_code;

		// Clean this up.
		if(datum.branch_cost_code) {
			// TODO: This is where `branches_index` gets populated.
			cost_code = datum.branch_cost_code;
			task = new Branch(datum, cost_code);
		} else if(datum.task_cost_code) {
			// TODO: This is where `leaves_index` gets populated.
			cost_code = datum.task_cost_code;
			task = new Leaf(datum, cost_code);
		} else {
			console.err('Error: Task was not type "Branch" nor "Leaf".');
		}

		this.collection[task.task_id] = task;
	}

	populate_parents() {
		for(const task_id in this.collection) {
			this.collection[task_id].generate_parent(this);
		}
	}
}

class Task {
	constructor(datum, cost_code) {
		this.task_id = datum.task_id;
		this.parent = datum.task_branch;
		this.cost_code = cost_code;
		this.name = datum.task_name;
		this.description = datum.task_description;
	}

	generate_parent(tasks_collection) {
		let parent_id = this.parent;

		this.parent = tasks_collection.get_task_by_task_id(this.parent);
	}
}


class Branch extends Task {
	constructor(datum, cost_code) {
		super(datum, cost_code);
		this.branch_id = datum.idtasks_branches;
		this.total = 0;
		this.children = [];
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
	const tasks_collection = new TasksCollection();

	tasks_collection.import(data);
	tasks_collection.populate_parents();

	let pause;
}

async function json() {
	let json = await fsp.readFile(`tasks.json`, 'utf-8')
	return JSON.parse(json)
}

let data = await json()
if (data) handler(data)
