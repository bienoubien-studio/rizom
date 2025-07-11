import type { User } from '$lib/core/collections/auth/types';

/**
 * Checks if a user has admin privileges.
 *
 * @param user - The user object to check for admin privileges
 * @returns True if the user exists and has the admin role, false otherwise
 *
 * @example
 * // Check if current user is an admin
 * if (isAdmin(currentUser)) {
 *   // Perform admin-only operations
 * }
 */
export const isAdmin = (user?: User) => !!user && hasRoles(user, 'admin');

/**
 * Checks if a user has any of the specified roles.
 *
 * @param user - The user object to check roles for
 * @param roles - One or more role names to check against the user's roles
 * @returns True if the user exists and has at least one of the specified roles, false otherwise
 *
 * @example
 * // Check if user has either editor or reviewer role
 * if (hasRoles(user, 'editor', 'reviewer')) {
 *   // Allow access to editing features
 * }
 */
export const hasRoles = (user?: User, ...roles: string[]) => !!user && user.roles.some((role) => roles.includes(role));

/**
 * Checks if a user is an admin or matches the specified ID.
 * Useful for operations that should be allowed for admins or the user themselves.
 *
 * @param user - The user object to check
 * @param id - The ID to compare against the user's ID
 * @returns True if the user is an admin or if the user's ID matches the provided ID
 *
 * @example
 * // Check if user can edit a profile (either as admin or as the profile owner)
 * if (isAdminOrMe(currentUser, profileId)) {
 *   // Allow profile editing
 * }
 */
export const isAdminOrMe = (user?: User, id?: string) => {
	return isAdmin(user) || user?.id === id;
};

/**
 * Checks if a user's ID matches the specified ID.
 * Used for operations that should only be allowed for the user themselves.
 *
 * @param user - The user object to check
 * @param id - The ID to compare against the user's ID
 * @returns True if the user exists and their ID matches the provided ID
 *
 * @example
 * // Check if user is accessing their own settings
 * if (isMe(currentUser, requestedUserId)) {
 *   // Allow access to personal settings
 * }
 */
export const isMe = (user?: User, id?: string) => {
	return !!(user && id === user.id);
};

/**
 * Collection of access control utility functions.
 * Provides methods for checking user permissions and roles.
 */
export const access = { isAdmin, hasRoles, isAdminOrMe, isMe };

export default { isAdmin, hasRoles, isAdminOrMe, isMe };
