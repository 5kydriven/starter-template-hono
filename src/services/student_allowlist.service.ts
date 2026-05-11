import { Errors } from '@/lib/errors';
import { StudentAllowlistsRepo } from '@/repositories/student_allowlists.repo';

export const createStudentAllowlistService = (
	studentAllowlistsRepo: StudentAllowlistsRepo,
) => ({
	async getById(id: string) {
		const studentAllowlist = await studentAllowlistsRepo.findById(id);
		if (!studentAllowlist) throw Errors.notFound('Student Allowlist not found');
		return studentAllowlist;
	},

	async getByStudentNumber(studentNumber: string) {
		const studentAllowlist =
			await studentAllowlistsRepo.findByStudentNumber(studentNumber);
		if (!studentAllowlist) throw Errors.notFound('Student Allowlist not found');
		return studentAllowlist;
	},

	async verify(studentNumber: string) {
		return studentAllowlistsRepo.findByStudentNumber(studentNumber);
	},

	async markRegistered(studentNumber: string, registeredUserId: string) {
		const studentAllowlist = await studentAllowlistsRepo.markRegistered(
			studentNumber,
			registeredUserId,
		);
		if (!studentAllowlist) throw Errors.notFound('Student Allowlist not found');
		return studentAllowlist;
	},

	async importRows(
		rows: { studentNumber: string; name: string }[],
		uploadedBy: string,
	) {
		const uniqueRows = new Map<
			string,
			{ studentNumber: string; name: string }
		>();
		let duplicateRows = 0;

		for (const row of rows) {
			if (uniqueRows.has(row.studentNumber)) {
				duplicateRows += 1;
				continue;
			}

			uniqueRows.set(row.studentNumber, row);
		}

		const dedupedRows = Array.from(uniqueRows.values());
		const existingStudentNumbers =
			await studentAllowlistsRepo.findExistingStudentNumbers(
				dedupedRows.map((row) => row.studentNumber),
			);
		const rowsToInsert = dedupedRows
			.filter((row) => !existingStudentNumbers.has(row.studentNumber))
			.map((row) => ({ ...row, uploadedBy }));

		const insertedRows = await studentAllowlistsRepo.createMany(rowsToInsert);

		return {
			inserted: insertedRows.length,
			skipped:
				duplicateRows +
				existingStudentNumbers.size +
				(rowsToInsert.length - insertedRows.length),
		};
	},

	async listOffset(opts: {
		page: number;
		perPage: number;
		search?: string;
		sortField?: 'name' | 'createdAt';
		sortOrder?: 'asc' | 'desc';
	}) {
		return studentAllowlistsRepo.findManyOffset(opts);
	},

	async listCursor(opts: {
		cursor: string | null;
		perPage: number;
		direction: 'next' | 'prev';
	}) {
		return studentAllowlistsRepo.findManyCursor(opts);
	},
});
