import { json, type RequestEvent, type RequestHandler } from '@sveltejs/kit';
import { Cache } from './cache.server.js';
import type { Plugin } from '$lib/types';
import { handler } from './handler.server.js';
import { toHash } from '$lib/util/string.js';
import HeaderButton from './HeaderButton.svelte';

export type CacheActions = {
	get: <T>(name: string, get: () => Promise<T>) => Promise<T>;
	clear: () => ReturnType<RequestHandler>;
	isEnabled: (event: RequestEvent) => boolean;
	toHashKey: (...params: unknown[]) => string;
	createKey: (namespace: string, params: Record<string, unknown>) => string;
};

type CacheOptions = { isEnabled?: (event: RequestEvent) => boolean };

export const cache: Plugin<CacheOptions> = (options) => {
	async function getAction<T>(key: string, get: () => Promise<T>): Promise<T> {
		return await Cache.get<T>(key, get);
	}

	const clearCache = () => {
		Cache.clear();
		return json({ message: 'Cache cleared' });
	};

	/**
	 * Helper to convert any value to a string representation for cache keys
	 */
	const valueToString = (value: unknown): string => {
		if (value === undefined || value === null) {
			return '0';
		}
		if (Array.isArray(value)) {
			return value.map(valueToString).join(',');
		}
		return String(value);
	};

	const actions: CacheActions = {
		get: getAction,
		clear: clearCache,
		toHashKey: (...params) => {
			return toHash(params.map(valueToString).join('-'));
		},
		createKey: (namespace: string, params: Record<string, unknown>) => {
			// Start with the namespace
			const values = [namespace];
			// Add all parameter values in a consistent order (sort keys)
			Object.keys(params)
				.sort()
				.forEach((key) => {
					values.push(`${key}:${valueToString(params[key])}`);
				});

			return toHash(values.join('-'));
		},
		isEnabled: options?.isEnabled || ((event) => !event.locals.user)
	};

	return {
		name: 'cache',
		core: true,
		configure: (config) => {
			config = {
				...config,
				panel: {
					...(config.panel || {}),
					components: {
						...(config.panel.components || { header: [], collectionHeader: [] }),
						header: [...(config.panel.components?.header || []), HeaderButton]
					}
				}
			};
			return config;
		},
		routes: {
			'/api/clear-cache': {
				POST: clearCache
			}
		},

		actions,
		handler
	};
};
