// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

async function main() {
	await prisma.role.create({
		data: {
			name: 'ADMIN'
		}
	});

	await prisma.role.create({
		data: {
			name: 'SELLER'
		}
	});
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
