import type { FieldBuilder } from 'rizom/fields/builders';
import type { AnyField, Field } from './fields';
import type { TabsFieldRaw } from 'rizom/fields/tabs';
import type { BlocksFieldRaw } from 'rizom/fields/blocks';
import type { GroupFieldRaw } from 'rizom/fields/group';
import type { Collection } from './config';
import type { RelationValue } from 'rizom/types';

export type OmitPreservingDiscrimination<T, K extends keyof T> = T extends any ? Omit<T, K> : never;
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

type AsTuple<T> = {
	[K in keyof T]: T[K];
}[keyof T][];

type WithUpload<T extends { upload?: boolean }> = T & {
	upload: true;
	imageSizes?: ImageSizesConfig[];
	accept: string[];
	out: 'jpeg' | 'webp';
};

type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type WithRelationPopulated<T> = {
	[K in keyof T]: NonNullable<T[K]> extends RelationValue<infer U>
		? T[K] extends undefined
			? undefined
			: U[]
		: T[K] extends object
			? WithRelationPopulated<T[K]>
			: T[K];
};

type WithoutBuilders<T> =
	T extends Array<infer U>
		? U extends FieldBuilder<any>
			? Field[]
			: Array<WithoutBuilders<U>>
		: T extends { fields: FieldBuilder<any>[] }
			? Omit<T, 'fields'> & { fields: Field[] }
			: T extends { tabs: Array<{ fields: FieldBuilder<any>[] }> }
				? Omit<T, 'tabs'> & {
						tabs: Array<
							Omit<T['tabs'][number], 'fields'> & {
								fields: Field[];
							}
						>;
					}
				: T extends { blocks: Array<{ fields: FieldBuilder<any>[] }> }
					? Omit<T, 'blocks'> & {
							blocks: Array<
								Omit<T['blocks'][number], 'fields'> & {
									fields: Field[];
								}
							>;
						}
					: T extends Function
						? T
						: T extends object
							? { [K in keyof T]: WithoutBuilders<T[K]> }
							: T;
