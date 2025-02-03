import type { FieldBuilder } from 'rizom/fields/_builders';
import type { AnyField } from './fields';
import type { RawTabsField } from 'rizom/fields/tabs';
import type { RawBlocksField } from 'rizom/fields/blocks';
import type { RawGroupField } from 'rizom/fields/group';

export type WithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export type WithOptional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];
export type Dic = Record<string, any>;
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
	...args: any
) => Promise<infer R>
	? R
	: any;

export type PublicBuilder<T> = Omit<
	InstanceType<T>,
	'component' | 'cell' | 'toType' | 'toSchema' | 'raw' | 'type' | 'name'
>;

type AnyFunction = (...args: any[]) => any;

type WithoutBuilders<T> =
	T extends Array<infer U>
		? U extends FieldBuilder<any>
			? AnyField[]
			: Array<WithoutBuilders<U>>
		: T extends { fields: FieldBuilder<any>[] }
			? Omit<T, 'fields'> & { fields: AnyField[] }
			: T extends { tabs: Array<{ fields: FieldBuilder<any>[] }> }
				? Omit<T, 'tabs'> & { tabs: Array<{ fields: AnyField[] }> }
				: T extends { blocks: Array<{ fields: FieldBuilder<any>[] }> }
					? Omit<T, 'blocks'> & { blocks: Array<{ fields: AnyField[] }> }
					: T extends object
						? { [K in keyof T]: WithoutBuilders<T[K]> }
						: T;
