import { NewScholarshipProgram } from '@/db/schema';
import { Errors } from '@/lib/errors';
import { ScholarshipProgramsRepo } from '@/repositories/scholarship_programs.repo';

export const createScholarshipProgramsService = (
	scholarshipProgramsRepo: ScholarshipProgramsRepo,
) => ({
	async getById(id: string) {
		const scholarshipProgram = await scholarshipProgramsRepo.findById(id);
		if (!scholarshipProgram)
			throw Errors.notFound('Scholarship Program not found');
		return scholarshipProgram;
	},

	async softDelete(id: string) {
		const scholarshipProgram = await scholarshipProgramsRepo.softDelete(id);
		if (!scholarshipProgram)
			throw Errors.notFound('Scholarship Program not found');
		return scholarshipProgram;
	},

	async create(scholarshipProgram: NewScholarshipProgram) {
		return scholarshipProgramsRepo.create(scholarshipProgram);
	},

	async update(id: string, scholarshipProgram: Partial<NewScholarshipProgram>) {
		const scholarshipProgramToUpdate =
			await scholarshipProgramsRepo.findById(id);
		if (!scholarshipProgramToUpdate)
			throw Errors.notFound('Scholarship Program not found');
		return scholarshipProgramsRepo.update(id, scholarshipProgram);
	},

	async listOffset(opts: {
		page: number;
		perPage: number;
		search?: string;
		sortField?: 'name' | 'createdAt';
		sortOrder?: 'asc' | 'desc';
	}) {
		return scholarshipProgramsRepo.findManyOffset(opts);
	},

	async listCursor(opts: {
		cursor: string | null;
		perPage: number;
		direction: 'next' | 'prev';
	}) {
		return scholarshipProgramsRepo.findManyCursor(opts);
	},
});

export type ScholarshipProgramsService = ReturnType<
	typeof createScholarshipProgramsService
>;
