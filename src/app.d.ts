// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

import type { Role } from '@prisma/client';

declare global {
	declare namespace App {
		interface Locals {
			user;
			session: {
				roles?: Role[];
			};
			formData: FormData;
		}
	}
	// interface Error {}
	// interface Locals {}
	// interface PageData {}
	// interface Platform {}
}
