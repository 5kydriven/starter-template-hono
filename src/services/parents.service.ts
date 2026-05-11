import { NewParent } from '@/db/schema';
import { Errors } from '@/lib/errors';
import { ParentsRepo } from '@/repositories/parents.repo';

export const createParentsService = (parentsRepo: ParentsRepo) => ({
	async getById(id: string) {
		const parent = await parentsRepo.findById(id);
		if (!parent) throw Errors.notFound('Parent not found');
		return parent;
	},

	async create(parent: NewParent) {
		return await parentsRepo.create(parent);
	},

	async update(id: string, parent: Partial<NewParent>) {
		const parentToUpdate = await parentsRepo.findById(id);
		if (!parentToUpdate) throw Errors.notFound('Parent not found');
		return await parentsRepo.update(id, parent);
	},

	async delete(id: string) {
		const parent = await parentsRepo.delete(id);
		if (!parent) throw Errors.notFound('Parent not found');
	},

	async listOffset(opts: {
		page: number;
		perPage: number;
		search?: string;
		sortField?: 'firstName' | 'lastName' | 'middleName' | 'createdAt';
		sortOrder?: 'asc' | 'desc';
	}) {
		return parentsRepo.findManyOffset(opts);
	},

	async listCursor(opts: {
		cursor: string | null;
		perPage: number;
		direction: 'next' | 'prev';
	}) {
		return parentsRepo.findManyCursor(opts);
	},
});

export type ParentsService = ReturnType<typeof createParentsService>;
