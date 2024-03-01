import { promises as fsp } from 'fs'


class TasksCollection {
	constructor() {
		this.collection = {};
	}

	add(datum) {
		let task;

		if(datum.branch_cost_code) {
			task = new Branch(datum);
		} else if(datum.task_cost_code) {
			task = new Leaf(datum);
		} else {
			console.err('Error: Task was not type "Branch" nor "Leaf".');
		}

		this.collection[task.task_id] = task;
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

	get_task_by_id(id, task_type) {
		for(const task_id in this.collection) {
			let task = this.collection[task_id];
			if (task.id == id && task.constructor.name == task_type) {
				return task;
			}
		}
	}
	
	get_task_by_task_id(task_id) {
		return this.collection[task_id];
	}

	adjust_parent_ids() {
		for(const task_id in this.collection) {
			this.collection[task_id].adjust_parent_id(this);
		}
	}

	// generate_parents() {
	// 	for(const task_id in this.collection) {
	// 		this.collection[task_id].generate_parent(this);
	// 	}
	// }

	// calculate_cost_codes() {
	// 	for(const task_id in this.collection) {
	// 		this.collection[task_id].calculate_cost_code();
	// 		// this.collection[task].calculate_cost_code(this); // Does this method call need a `this`?
	// 	}
	// }
}

class Task {
	constructor(datum) {
		this.task_id = datum.task_id;
		this.parent = datum.task_branch;
		this.cost_code = null;
		this.name = datum.task_name;
		this.description = datum.task_description;

		if(datum.branch_cost_code) {
			this.cost_code = datum.branch_cost_code;
		} else if(datum.task_cost_code) {
			this.cost_code = datum.task_cost_code;
		} else {
			console.err('CostCodeError: Task has no valid Cost Code.')
		}
	}

	adjust_parent_id(tasks_collection) {
		let parent_id, parent_task, task_id;

		if (this.parent) {
			parent_id = this.parent;
			parent_task = tasks_collection.get_task_by_id(parent_id, this.constructor.name);
			task_id = parent_task.task_id;
			this.parent = task_id;
		}
	}

	// generate_parent(tasks_collection) {
	// 	this.parent = tasks_collection.get_task_by_task_id(this.parent);
	// }

	calculate_cost_code(parent=this.parent, cost_code=this.cost_code) {
		if(!parent) {
			this.cost_code = cost_code;
		} else {
			let updated_cost_code = `${parent.cost_code}.${cost_code}`
			this.cost_code = this.calculate_cost_code(parent.parent, updated_cost_code)
		}
	};
}

class Branch extends Task {
	constructor(datum) {
		super(datum);
		this.id = datum.idtasks_branches;
		this.total = 0;
		this.children = [];
	};

	calculate_totals() {
		// do stuff here.
	}
}

class Leaf extends Task {
	constructor(datum) {
		super(datum);
		this.id = datum.idtasks_leaves;
		this.quantity = datum.item_quantity;
		this.cost = datum.item_cost;
		this.tax = datum.item_tax;
		this.markup = datum.item_markup;
		this.net = 'wtf is this?'; // Computed value of: cost * quantity * (1+tax) * (1+markup)
		this.stage = datum.task_stage;
		this.category = datum.idtask_categories;
	};
}

export const handler = async (data) => {
	const tasks_collection = new TasksCollection();

	tasks_collection.import(data);
	// tasks_collection.adjust_parent_ids();
	// tasks_collection.generate_parents();
	// tasks_collection.calculate_cost_codes()
	// branches_collection.populate_children();
	// branches_collection.calculate_totals();

	let pause;
}

async function json() {
	let json = await fsp.readFile(`tasks.json`, 'utf-8')
	return JSON.parse(json)
}

let data = await json()
if (data) handler(data)
