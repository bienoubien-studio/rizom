import { RizomError } from "$lib/core/errors/index.js";
import { Hooks } from "$lib/core/operations/hooks/index.js";

/**
* Before update :
* - prevent superadmin to be changed by someone else
*/
export const preventSuperAdminMutation = Hooks.beforeUpdate( async (args) => {
	const { event, context } = args;
	const originalDoc = context.originalDoc
	
	if(!originalDoc) throw new RizomError(RizomError.OPERATION_ERROR, 'missing originalDoc @preventSuperAdminMutation')
		
	const IS_ROLES_MUTATION = 'roles' in args.data && Array.isArray(args.data.roles);
	const IS_SUPERADMIN_MUTATION = await event.locals.rizom.auth.isSuperAdmin(originalDoc.id);

	// Prevent super admin user to be changed by someone
	if (IS_SUPERADMIN_MUTATION && !event.locals.user?.isSuperAdmin) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}
	
	// Prevent "admin" roles of superadmin to be deleted
	if (IS_SUPERADMIN_MUTATION && IS_ROLES_MUTATION && !args.data.roles.includes('admin')) {
		args.data.roles.push('admin');
	}
	
	// Prevent superAdmin value to be changed
	if ('isSuperAdmin' in args.data && !event.locals.isInit) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}
	
	return args;
});