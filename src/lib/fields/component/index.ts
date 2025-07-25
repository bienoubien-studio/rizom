import type { Field } from '$lib/fields/types.js';
import { FieldBuilder } from '../builders/index.js';
import type { FieldAccess } from '$lib/fields/types.js';
import type { Component } from 'svelte';
import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte.js';
import type { GenericDoc } from '$lib/core/types/doc.js';

type TypedComponent = Component<{
	path: string;
	config: ComponentField;
	form: DocumentFormContext<GenericDoc>;
}>;

export const component = (component: TypedComponent) => new ComponentFieldBuilder(component);

class ComponentFieldBuilder extends FieldBuilder<ComponentField> {
	//
	constructor(component: TypedComponent) {
		super('component');
		this.field.component = component;
	}
	condition(func: (doc: any) => boolean) {
		this.field.condition = func;
		return this;
	}
	access(access: { create: FieldAccess; read: FieldAccess; update: FieldAccess }) {
		this.field.access = access;
		return this;
	}
}

/****************************************************/
/* Types
/****************************************************/

export type ComponentField = Field & {
	type: 'component';
	component: TypedComponent;
};
