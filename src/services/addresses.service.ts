import { NewAddress } from '@/db/schema';
import { Errors } from '@/lib/errors';
import { AddressesRepo } from '@/repositories/adresses.repo';

export const createAddressesService = (addressesRepo: AddressesRepo) => ({
	async getById(id: string) {
		const address = await addressesRepo.findById(id);
		if (!address) throw Errors.notFound('Address not found');
		return address;
	},

	async delete(id: string) {
		const address = await addressesRepo.delete(id);
		if (!address) throw Errors.notFound('Address not found');
	},

	async create(address: NewAddress) {
		return await addressesRepo.create(address);
	},

	async update(id: string, address: Partial<NewAddress>) {
		const addressToUpdate = await addressesRepo.findById(id);
		if (!addressToUpdate) throw Errors.notFound('Address not found');
		return await addressesRepo.update(id, address);
	},

	async listOffset(opts: {
		page: number;
		perPage: number;
		search?: string;
		sortField?: 'province' | 'cityMunicipality' | 'barangay' | 'street';
		sortOrder?: 'asc' | 'desc';
	}) {
		return addressesRepo.findManyOffset(opts);
	},

	async listCursor(opts: {
		cursor: string | null;
		perPage: number;
		direction: 'next' | 'prev';
	}) {
		return addressesRepo.findManyCursor(opts);
	},
});

export type AddressesService = ReturnType<typeof createAddressesService>;
