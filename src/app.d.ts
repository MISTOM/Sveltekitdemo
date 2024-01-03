// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

 declare global {
	 declare namespace App {
		interface Locals {
			user: {
				id: number;
				role: number;
			},
			data: FormData
		}
	}
	// interface Error {}
	// interface Locals {}
	// interface PageData {}
	// interface Platform {}
}
