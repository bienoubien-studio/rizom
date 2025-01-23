import { validate } from 'rizom/utils/index.js';
import { access } from 'rizom/utils/access/index.js';
import { email, select, text } from 'rizom/fields';

const emailField = email('email')
	.access({
		read: (user) => !!user,
		update: (user) => false
	})
	.required()
	.unique();

const name = text('name')
	.access({
		create: (user) => !!user,
		read: (user) => true,
		update: (user) => false
	})
	.required();

const roles = select('roles')
	.options({ value: 'admin', label: 'Admin' }, { value: 'user', label: 'User' })
	.many()
	.defaultValue('user')
	.required()
	.access({
		create: (user) => !!user && access.isAdmin(user),
		read: (user) => !!user && access.isAdmin(user),
		update: (user) => !!user && access.isAdmin(user)
	});

const password = text('password')
	.required()
	.access({
		create: (user) => !!user && access.isAdmin(user),
		read: (user) => false,
		update: (user) => false
	})
	.validate((value) => validate.password(value));

const confirmPassword = text('confirmPassword')
	.label('Confirm password')
	.required()
	.validate((value, metas) => {
		if (metas.data.password !== value) {
			return 'Password mismatch';
		}
		return true;
	});

export const usersFields = {
	email: emailField,
	name,
	roles,
	password,
	confirmPassword
};
