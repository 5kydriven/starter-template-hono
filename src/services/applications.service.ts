import { NewApplication } from '@/db/schema';
import { Errors } from '@/lib/errors';
import { ApplicationsRepo } from '@/repositories/applications';

export const createApplicationsService = (
	applicationsRepo: ApplicationsRepo,
) => ({
	async getById(id: string) {
		const application = await applicationsRepo.findById(id);
		if (!application) throw Errors.notFound('Application not found');
		return application;
	},

	async delete(id: string) {
		const application = await applicationsRepo.delete(id);
		if (!application) throw Errors.notFound('Application not found');
	},

	async create(application: NewApplication) {
		return applicationsRepo.create(application);
	},

	async update(id: string, application: Partial<NewApplication>) {
		const applicationToUpdate = await applicationsRepo.findById(id);
		if (!applicationToUpdate) throw Errors.notFound('Application not found');
		return applicationsRepo.update(id, application);
	},

	async listOffset(opts: {
		page: number;
		perPage: number;
		search?: string;
		sortField?: 'firstName' | 'lastName' | 'middleName' | 'createdAt';
		sortOrder?: 'asc' | 'desc';
	}) {
		return applicationsRepo.findManyOffset(opts);
	},

	async listCursor(opts: {
		cursor: string | null;
		perPage: number;
		direction: 'next' | 'prev';
	}) {
		return applicationsRepo.findManyCursor(opts);
	},
});

export type ApplicationsService = ReturnType<typeof createApplicationsService>;
