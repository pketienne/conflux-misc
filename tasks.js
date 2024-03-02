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
		let pause;
		return cost_code_aggregated;
	}

	// calculate_cost_code(collections, cost_code_aggregated=this.cost_code, task=this) {
	// 	if(!task.parent_id) {
	// 		task.cost_code_aggregated = cost_code_aggregated;
	// 	} else {
	// 		let parent = collections.get_parent_by_id(task.parent_id);
	// 		cost_code_aggregated = `${cost_code_aggregated}.${parent.cost_code}`;
	// 		this.calculate_cost_code(collections, cost_code_aggregated, parent)
	// 	}
	// }

	// calculate_cost_code(collections, cost_code_aggregated=this.cost_code_aggregated, task=this) {
	// 	if(!task.parent_id) {
	// 		if(!parent.parent_id) {
	// 			task.cost_code_aggregated = task.cost_code;
	// 		} else {
	// 			task.cost_code_aggregated = `${task.cost_code}.${task.cost_code_aggregated}`;
	// 		}
	// 	} else {
	// 		let parent = collections.get_parent_by_id(task.parent_id);
	// 		cost_code_aggregated = `${task.cost_code}.${task.cost_code_aggregated}`
	// 		task.calculate_cost_code(collections, cost_code_aggregated, parent)
	// 	}
	// }

	// calculate_cost_code(
	// 	collections, parent_id=this.parent_id, cost_code=this.cost_code
	// ) {

	// 	// temp code
	// 	if (this.task_id = 1872) {
	// 		console.log(this.task_id);
	// 	}
	// 	//

	// 	if(!parent_id) {
	// 		this.cost_code_aggregated = cost_code;
	// 	} else {
	// 		let parent = collections.get_parent_by_id(this.parent_id)
	// 		parent_id = parent.parent_id;
	// 		cost_code = `${parent.cost_code}.${cost_code}`;
	// 		this.calculate_cost_code(collections, parent_id, cost_code);
	// 	}
	// }
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
	const collections = new Collections();

	collections.import(data);
	collections.calculate_cost_codes();

	let pause;
}

async function json() {
	let json = await fsp.readFile(`tasks.json`, 'utf-8')
	return JSON.parse(json)
}

let data = await json()
if (data) handler(data)
