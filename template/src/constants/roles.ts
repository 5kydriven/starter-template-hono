import { UserRole } from '@/types/common';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
	viewer: 1,
	member: 2,
	editor: 3,
	admin: 4,
};

export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean =>
	ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
