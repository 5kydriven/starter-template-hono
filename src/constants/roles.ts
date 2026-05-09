export const USER_ROLES = ['admin', 'personnel', 'student'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_HIERARCHY: Record<UserRole, number> = {
	student: 1,
	personnel: 2,
	admin: 3,
};

export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean =>
	ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];

export const isUserRole = (role: unknown): role is UserRole =>
	typeof role === 'string' && USER_ROLES.includes(role as UserRole);
