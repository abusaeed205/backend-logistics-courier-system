import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../prisma/generated/prisma/client";




const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });


export { prisma };

// import "dotenv/config";
// import { PrismaPg } from "@prisma/adapter-pg";
// import { PrismaClient } from "../../../prisma/generated/prisma/client";


// const connectionString = `${process.env.DATABASE_URL}`;

// const adapter = new PrismaPg({
// 	connectionString,
// 	max: 10,
// 	idleTimeoutMillis: 30000,
// 	connectionTimeoutMillis: 10000,
// 	keepAlive: true,
// });
// const prisma = new PrismaClient({ adapter });


// export { prisma };