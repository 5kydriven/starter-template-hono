import { Errors } from '@/lib/errors';
import { UpdateStaffProfileInput } from '@/modules/staff_profiles/staff_profiles.schema';
import type { StaffProfilesRepo } from '@/repositories/staff_profiles.repo';
import { SortOrder } from '@/types/common';

export const createStaffProfilesService = (
	staffProfilesRepo: StaffProfilesRepo,
) => ({
	async create(data: {
		userId: string;
		name: string;
		email: string;
		firstName: string;
		lastName: string;
		department: string;
		position: string;
		contactNumber?: string;
	}) {
		try {
			const user = await staffProfilesRepo.updateUserRole(
				data.userId,
				'personnel',
			);

			if (!user) {
				throw Errors.notFound('Created user not found');
			}

			const profile = await staffProfilesRepo.create({
				userId: data.userId,
				firstName: data.firstName,
				lastName: data.lastName,
				department: data.department,
				position: data.position,
				role: 'personnel',
				contactNumber: data.contactNumber,
			});

			return {
				user: {
					id: user.id,
					name: data.name,
					email: data.email,
					role: 'personnel' as const,
				},
				staffProfile: profile,
			};
		} catch (error) {
			try {
				await staffProfilesRepo.deleteUser(data.userId);
			} catch (cleanupError) {
				console.error(
					'[staff-profiles] failed to clean up created user',
					cleanupError,
				);
			}

			throw error;
		}
	},

	async getById(id: string) {
		const staff = await staffProfilesRepo.findById(id);
		if (!staff) throw Errors.notFound('Personnel not found');
		return staff;
	},

	async update(id: string, data: UpdateStaffProfileInput) {
		const updated = await staffProfilesRepo.update(id, data);
		if (!updated) throw Errors.notFound('Personnel not found');
		return updated;
	},

	async delete(id: string) {
		const personnel = await staffProfilesRepo.delete(id);
		if (!personnel) throw Errors.notFound('Personnel not found');
	},

	async listOffset(opts: {
		page: number;
		perPage: number;
		search?: string;
		sortField?: 'lastName' | 'firstName' | 'createdAt';
		sortOrder?: SortOrder;
	}) {
		return staffProfilesRepo.findManyOffset(opts);
	},

	async listCursor(opts: {
		cursor: string | null;
		perPage: number;
		direction: 'next' | 'prev';
	}) {
		return staffProfilesRepo.findManyCursor(opts);
	},
});

export type StaffProfilesService = ReturnType<
	typeof createStaffProfilesService
>;
