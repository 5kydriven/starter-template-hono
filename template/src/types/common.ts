export type UserRole = 'admin' | 'editor' | 'member' | 'viewer';

export interface AuthUser {
	id: string;
	email: string;
	role: UserRole;
}

export interface OffsetPaginationMeta {
	total: number;
	page: number;
	perPage: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export interface CursorPaginationMeta {
	nextCursor: string | null;
	prevCursor: string | null;
	hasNext: boolean;
	hasPrev: boolean;
	perPage: number;
}

export type SortOrder = 'asc' | 'desc';
