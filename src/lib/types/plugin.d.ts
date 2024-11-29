import type { Component } from 'svelte';
import type { BuiltConfig, RouteConfig } from './config';
import type { AnyFormField } from '.';

type MaybeAsyncFunction = (...args: any[]) => any | Promise<any>;
type PluginField = {
	type: string;
	component: Component;
	templates: {
		schema: (field: AnyFormField) => string;
		type: (field: AnyFormField) => string;
	};
};

type PluginReturn = {
	name: string;
	configure?: (config: BuiltConfig) => BuiltConfig;
	actions?: Record<string, MaybeAsyncFunction>;
	routes?: Record<string, RouteConfig>;
	fields?: PluginField[];
};

export type Plugin<TArgs extends Dic = never> = [TArgs] extends [never]
	? (options?: TArgs) => PluginReturn
	: // When generic is provided, options is required
		(options: TArgs) => PluginReturn;
