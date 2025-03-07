import type { FormField } from 'rizom/types/index.js';
import type { Dic } from 'rizom/types/utility.js';
import { FieldBuilder, FormFieldBuilder } from '../builders/index.js';
import Tree from './component/Tree.svelte';
import Cell from './component/Cell.svelte';
import { text } from '../text/index.js';
import { number } from '../number/index.js';
import type { Field } from 'rizom/types/fields.js';
import type { TreeBlock } from 'rizom/types/doc.js';
import cloneDeep from 'clone-deep';
import { snapshot } from 'rizom/utils/state.js';

export const tree = (name: string) => new TreeBuilder(name);

export class TreeBuilder extends FormFieldBuilder<TreeField> {
	constructor(name: string) {
		super(name, 'tree');
		this.field.defaultValue = [];
		this.field.isEmpty = (value) => !value || (Array.isArray(value) && value.length === 0);
		this.field.fields = [text('path').hidden(), number('position').hidden()];
		this.field.maxDepth = 50;
		this.field.addItemLabel = 'Add an item';
	}

	get component() {
		return Tree;
	}
	get cell() {
		return Cell;
	}

	toType() {
		const fieldsTypes = this.field.fields
			.filter((field) => field instanceof FormFieldBuilder)
			.map((field) => field.toType())
			.join(',\n');
		return `${this.field.name}: Array<{${fieldsTypes}}>`;
	}

	fields(...fields: FieldBuilder<Field>[]) {
		this.field.fields = [...(this.field.fields || []), ...fields];
		return this;
	}

	addItemLabel(label: string) {
		this.field.addItemLabel = label;
		return this;
	}

	renderTitle(render: TreeFieldBlockRenderTitle) {
		this.field.renderTitle = render;
		return this;
	}

	maxDepth(n: number) {
		this.field.maxDepth = n;
		return this;
	}

	compile() {
		return {
			...this.field,
			fields: this.field.fields.map((f) => f.compile())
		};
	}
}

// Utility (debug)
export const treeToString = (blocks: TreeBlock[] | undefined | null) => {
	if (!blocks || !blocks.length) return '[none]';
	const copy = cloneDeep(snapshot(blocks));
	const reduceBlocks = (prev: Dic[], curr: TreeBlock) => {
		if (!curr.path || !curr) {
			throw new Error('wrong tree path');
		}
		const representation = {
			path: `${curr.path} - ${curr.position} - ${curr.id}`,
			_children:
				curr._children && Array.isArray(curr._children)
					? curr._children.reduce(reduceBlocks, [])
					: []
		};
		prev.push(representation);
		return prev;
	};

	const representation = copy.reduce(reduceBlocks, []);

	function transformToIndentedString(arr: Dic[], indent = 0) {
		let result = '';

		arr.forEach((item: Dic) => {
			// Add indentation based on current level
			result += ' '.repeat(indent * 4) + item.path + '\n';

			// Recursively process children if they exist
			if (item._children && item._children.length > 0) {
				result += transformToIndentedString(item._children, indent + 1);
			}
		});

		return result;
	}

	return '=====================\n' + transformToIndentedString(representation);
};

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////

export type TreeField = FormField & {
	type: 'tree';
	maxDepth: number;
	renderTitle?: TreeFieldBlockRenderTitle;
	fields: FieldBuilder<Field>[];
	addItemLabel: string;
};

export type TreeFieldBlockRenderTitle = (args: { values: Dic }) => string;

export type TreeFieldRaw = FormField & Omit<TreeField, 'fields'> & { fields: Field[] };

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		tree: any;
	}
	interface RegisterFormFields {
		TreeField: TreeField | TreeFieldRaw;
	}
}
