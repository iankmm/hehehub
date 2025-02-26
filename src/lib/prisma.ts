import { PrismaClient } from '@prisma/client'

/* eslint-disable no-var */
declare global {
  var prisma: PrismaClient | undefined
}
/* eslint-disable no-var */
const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export { prisma }
