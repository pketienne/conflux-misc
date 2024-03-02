import { promises as fsp } from 'fs'


class TasksCollection {
	constructor() {
		/**
		 * Just use one collection.
		 * Provide properties for `branches_collection` and `leaves_collection`.
		 * For referencing branches and leaves, just reference the singular
		 * collection using a filter to deliver only instances of the appropriate
		 * class type.
		 * 
		 * Also, make the class iterable.
		 * Relevant to `.populate_parents` method.
		 */
		this.branches_collection = new BranchesCollection();
		this.leaves_collection = new LeavesCollection();
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
			cost_code = datum.branch_cost_code;
			task = new Branch(datum, cost_code);
			this.branches_collection.add(task);
		} else if(datum.task_cost_code) {
			cost_code = datum.task_cost_code;
			task = new Leaf(datum, cost_code);
			this.leaves_collection.add(task);
		} else {
			console.err('Error: Task was not type "Branch" nor "Leaf".');
		}
	}

	populate_parents() {
		/**
		 * These can be collapsed into one function on the TasksCollection class
		 * once the TasksCollection has been changed to using one filtered
		 * collection.
		 */
		this.branches_collection.populate_parents();
		this.leaves_collection.populate_parents();
	}
}

class BranchesCollection {
	// Make this class iterable.
	constructor() {
		this.collection = {};
	}

	add(branch) {
		this.collection[branch.branch_id] = branch;
	}

	get_branch_by_branch_id(branch_id) {
		this.collection[branch_id]
	}

	populate_parents() {
		for(const branch_id in this.collection) {
			this.collection[branch_id].populate_parent(this);
		}
	}
}

class LeavesCollection {
	// Make this class iterable.
	constructor() {
		this.collection = {};
	}

	add(leaf) {
		this.collection[leaf.leaf_id] = leaf;
	}

	get_leaf_by_leaf_id(leaf_id) {
		this.collection[leaf_id]
	}

	populate_parents() {
		for(const leaf_id in this.collection) {
			this.collection[leaf_id].populate_parent(this);
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
}

class Branch extends Task {
	constructor(datum, cost_code) {
		super(datum, cost_code);
		this.branch_id = datum.idtasks_branches;
		this.total = 0;
		this.children = [];
	}
	
	populate_parent(branches_collection) {
		let parent_id, parent_task;

		parent_id = this.parent;
		parent_task = branches_collection.get_branch_by_branch_id(
			parent_id, this.constructor.name
		);
		
		this.parent = parent_task;
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
