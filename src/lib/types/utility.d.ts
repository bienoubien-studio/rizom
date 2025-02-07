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

type AnyFunction = (...args: any[]) => any;

type WithoutBuilders<T> =
	T extends Array<infer U>
		? U extends FieldBuilder<any>
			? Array<FieldBuilderToField<U>>
			: Array<WithoutBuilders<U>>
		: T extends { fields: FieldBuilder<any>[] }
			? Omit<T, 'fields'> & { fields: Array<FieldBuilderToField<T['fields'][number]>> }
			: T extends { tabs: Array<{ fields: FieldBuilder<any>[] }> }
				? Omit<T, 'tabs'> & {
						tabs: Array<
							Omit<T['tabs'][number], 'fields'> & {
								fields: Array<FieldBuilderToField<T['tabs'][number]['fields'][number]>>;
							}
						>;
					}
				: T extends { blocks: Array<{ fields: FieldBuilder<any>[] }> }
					? Omit<T, 'blocks'> & {
							blocks: Array<
								Omit<T['blocks'][number], 'fields'> & {
									fields: Array<FieldBuilderToField<T['blocks'][number]['fields'][number]>>;
								}
							>;
						}
					: T extends object
						? { [K in keyof T]: WithoutBuilders<T[K]> }
						: T;
