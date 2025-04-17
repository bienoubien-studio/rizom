import type { CacheActions } from './cache/index.js';
import type { Handle } from '@sveltejs/kit';
import type { Component } from 'svelte';
import type { GetRegisterType } from '$lib';
import type { BuiltConfig, RouteConfig } from '$lib/types/config.js';
import type { MailerActions } from './mailer/types.js';

type MaybeAsyncFunction = (...args: any[]) => any | Promise<any>;

export type CorePlugins = {
	cache: CacheActions;
	mailer: MailerActions;
};

export type Plugin<T = void> = (options: T) => {
	name: string;
	core?: boolean;
	configure?: (config: BuiltConfig) => BuiltConfig;
	actions?: Record<string, MaybeAsyncFunction>;
	routes?: Record<string, RouteConfig>;
	handler?: Handle;
	fields?: Array<{
		type: string;
		component: Component;
		cell: Component | null;
		toSchema: () => string;
		toType: () => string;
	}>;
};

export type MailerPlugin = {
	options: { from: string };
	sendMail: (args: {
		from: string;
		to: string;
		subject: string;
		text: string;
		html: string;
	}) => Promise<any>;
};

export type Plugins = CorePlugins & GetRegisterType<'Plugins'>;
