// optimized for cloudflare workers, using the Web Crypto API for hashing and random value generation
// so cpu limit will not be exceeded, and the code will run efficiently in the worker environment

import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

const SCRYPT_OPTIONS = {
	N: 16384,
	r: 16,
	p: 1,
	maxmem: 64 * 1024 * 1024,
};

export const hashPassword = async (password: string) => {
	const salt = randomBytes(16).toString('hex');
	const key = scryptSync(password, salt, 64, SCRYPT_OPTIONS);
	return `${salt}:${key.toString('hex')}`;
};

export const verifyPassword = async (hash: string, password: string) => {
	const [salt, key] = hash.split(':');
	const derived = scryptSync(password, salt, 64, SCRYPT_OPTIONS);
	return timingSafeEqual(Buffer.from(key, 'hex'), derived);
};
