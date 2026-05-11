import { NewProgramOffering } from '@/db/schema';
import { Errors } from '@/lib/errors';
import { ProgramOfferingsRepo } from '@/repositories/program_offerings';

export const createProgramOfferingsService = (
	programOfferingsRepo: ProgramOfferingsRepo,
) => ({
	async getById(id: string) {
		const programOffering = await programOfferingsRepo.findById(id);
		if (!programOffering) throw Errors.notFound('Program Offering not found');
		return programOffering;
	},

	async softDelete(id: string) {
		const programOffering = await programOfferingsRepo.softDelete(id);
		if (!programOffering) throw Errors.notFound('Program Offering not found');
		return programOffering;
	},

	async create(programOffering: NewProgramOffering) {
		return programOfferingsRepo.create(programOffering);
	},

	async update(id: string, programOffering: Partial<NewProgramOffering>) {
		const programOfferingToUpdate = await programOfferingsRepo.findById(id);
		if (!programOfferingToUpdate)
			throw Errors.notFound('Program Offering not found');
		return programOfferingsRepo.update(id, programOffering);
	},

	async listOffset(opts: {
		page: number;
		perPage: number;
		search?: string;
		sortField?: 'schoolYear' | 'createdAt';
		sortOrder?: 'asc' | 'desc';
	}) {
		return programOfferingsRepo.findManyOffset(opts);
	},

	async listCursor(opts: {
		cursor: string | null;
		perPage: number;
		direction: 'next' | 'prev';
	}) {
		return programOfferingsRepo.findManyCursor(opts);
	},
});

export type ProgramOfferingsService = ReturnType<
	typeof createProgramOfferingsService
>;
