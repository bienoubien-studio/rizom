import { UsersRound } from '@lucide/svelte';
import { access } from '$lib/util/access/index.js';
import { collection } from '$lib/core/collections/config/builder.js';
import { PANEL_USERS } from '$lib/core/collections/auth/constant.server.js';
import type { Collection, Option, PanelUsersConfig } from '../../../types.js';
import cloneDeep from 'clone-deep';

export const staffCollection = collection(PANEL_USERS, {
	label: { singular: 'User', plural: 'Users', gender: 'm' },
	panel: {
		description: 'Manage who can access your admin panel',
		group: 'system'
	},
	auth: {
		type: 'password',
		roles: ['admin', 'staff']
	},
	icon: UsersRound,
	fields: [],
	access: {
		read: (user) => access.isAdmin(user),
		create: (user) => access.isAdmin(user),
		delete: (user) => access.isAdmin(user),
		update: (user, { id }) => access.isAdminOrMe(user, id)
	}
});

export const mergeStaffCollection = ({
	roles: incomingRoles = [],
	fields,
	access,
	panel,
	label
}: PanelUsersConfig = {}): Collection<any> => {
	const collection = cloneDeep(staffCollection);
	let roles: Option[] = incomingRoles.map((role) => (typeof role === 'string' ? { value: role } : role));

	if (roles) {
		const hasAdminRole = roles.find((role) => role.value === 'admin');
		const otherRoles = roles.filter((role) => role.value !== 'admin');

		// Add admin role on Staff collection if not present
		if (!hasAdminRole) {
			roles = [{ value: 'admin' }, ...roles];
		}

		// If there is no other roles than admin add a staff role
		if (otherRoles.length === 0) {
			roles.push({ value: 'staff' });
		}

		if (!collection.auth || typeof collection.auth === 'boolean') {
			throw Error('predefined staff collection should have an auth:AuthConfig property, should never throw');
		}

		collection.auth.roles = roles.map((role) => role.value);
	}

	if (fields) {
		collection.fields.push(...fields);
	}
	if (access) {
		collection.access = {
			...collection.access,
			...access
		};
	}
	if (panel?.group) {
		collection.panel = { ...collection.panel, group: panel?.group };
	}
	if (label) {
		collection.label = label;
	}

	return {
		...collection
	};
};
