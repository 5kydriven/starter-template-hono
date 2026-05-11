import { notFound, unauthorized, forbidden } from '@/lib/openapi-responses';
import { AppEnv } from '@/types/app';
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
	AddressesOffsetQuerySchema,
	AddressesOffsetResponseSchema,
	AddressesCursorQuerySchema,
	AddressesCursorResponseSchema,
	AddressesParamsSchema,
	AddressResponseSchema,
	CreateAddressSchema,
	UpdateAddressSchema,
} from './addresses.schema';
import {
	listAddresses,
	listAddressesCursor,
	getAddress,
	createAddress,
	updateAddress,
	deleteAddress,
} from './addresses.handler';

export const listAddressesRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Addresses'],
	summary: 'List addresses (offset pagination)',
	request: { query: AddressesOffsetQuerySchema },
	responses: {
		200: {
			content: {
				'application/json': { schema: AddressesOffsetResponseSchema },
			},
			description: 'OK',
		},
	},
});

export const listAddressesCursorRoute = createRoute({
	method: 'get',
	path: '/cursor',
	tags: ['Addresses'],
	summary: 'List addresses (cursor pagination)',
	request: { query: AddressesCursorQuerySchema },
	responses: {
		200: {
			content: {
				'application/json': { schema: AddressesCursorResponseSchema },
			},
			description: 'OK',
		},
	},
});

export const getAddressRoute = createRoute({
	method: 'get',
	path: '/{id}',
	tags: ['Addresses'],
	summary: 'Get address by ID',
	request: { params: AddressesParamsSchema },
	responses: {
		200: {
			content: { 'application/json': { schema: AddressResponseSchema } },
			description: 'OK',
		},
		404: notFound,
	},
});

export const createAddressRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Addresses'],
	summary: 'Create a new address',
	request: {
		body: {
			content: { 'application/json': { schema: CreateAddressSchema } },
			required: true,
		},
	},
	responses: {
		201: {
			content: { 'application/json': { schema: AddressResponseSchema } },
			description: 'Created',
		},
		401: unauthorized,
		403: forbidden,
	},
});

export const updateAddressRoute = createRoute({
	method: 'put',
	path: '/{id}',
	tags: ['Addresses'],
	summary: 'Update a address',
	request: {
		params: AddressesParamsSchema,
		body: {
			content: { 'application/json': { schema: UpdateAddressSchema } },
			required: true,
		},
	},
	responses: {
		200: {
			content: { 'application/json': { schema: AddressResponseSchema } },
			description: 'OK',
		},
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const deleteAddressRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags: ['Addresses'],
	summary: 'Delete a address',
	request: { params: AddressesParamsSchema },
	responses: {
		204: { description: 'Deleted' },
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const addressesRoute = new OpenAPIHono<AppEnv>();

addressesRoute.openapi(listAddressesRoute, listAddresses);
addressesRoute.openapi(listAddressesCursorRoute, listAddressesCursor);
addressesRoute.openapi(getAddressRoute, getAddress);
addressesRoute.openapi(createAddressRoute, createAddress);
addressesRoute.openapi(updateAddressRoute, updateAddress);
addressesRoute.openapi(deleteAddressRoute, deleteAddress);
