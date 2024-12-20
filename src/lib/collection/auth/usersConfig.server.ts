import { UsersRound } from 'lucide-svelte';
import { access } from 'rizom/utils/access/index.js';
import { usersFields } from './usersFields.js';
import { text } from 'rizom/fields/text';
import type { CollectionConfig } from 'rizom';

export const hashedPassword = text('hashedPassword').required().hidden().toField();

export const panelUsersCollection: CollectionConfig = {
	slug: 'users',
	label: { singular: 'User', plural: 'Users' },
	auth: true,
	icon: UsersRound,
	fields: [usersFields.name, usersFields.email, usersFields.roles, hashedPassword],
	access: {
		read: (user) => !!user,
		create: (user) => access.isAdmin(user),
		delete: (user) => access.isAdmin(user),
		update: (user, { id }) => access.isAdminOrMyself(user, id)
	}
};
