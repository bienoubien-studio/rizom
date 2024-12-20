import { validate } from 'rizom/utils/index.js';
import { access } from 'rizom/utils/access/index.js';
import { email, select, text } from 'rizom/fields';

const emailField = email('email').hidden().required().unique().toField();
const name = text('name').required().toField();

const roles = select('roles')
	.options({ value: 'admin', label: 'Admin' })
	.many()
	.defaultValue('admin')
	.required()
	.access({
		create: (user) => !!user && access.isAdmin(user),
		read: (user) => !!user && access.isAdmin(user),
		update: (user) => !!user && access.isAdmin(user)
	})
	.toField();

const password = text('password')
	.required()
	.validate((value) => validate.password(value))
	.toField();

const confirmPassword = text('confirmPassword')
	.label('Confirm password')
	.required()
	.validate((value: string, metas) => {
		if (metas.data.password !== value) {
			return 'Password mismatch';
		}
		return true;
	})
	.toField();

export const usersFields = {
	email: emailField,
	name,
	roles,
	password,
	confirmPassword
};

type UsersFields = {
	email: typeof email;
	roles: typeof roles;
	password: typeof password;
	confirmPassword: typeof confirmPassword;
};

export type { UsersFields };
