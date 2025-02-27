import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: ['error', 'warn'],
  })

  // Add middleware for connection management
  client.$use(async (params, next) => {
    const MAX_RETRIES = 3
    let retries = 0

    while (retries < MAX_RETRIES) {
      try {
        return await next(params)
      } catch (error: any) {
        retries++
        
        // If it's a prepared statement error
        if (error?.message?.includes('prepared statement')) {
          console.log(`Retrying operation (${retries}/${MAX_RETRIES}) after prepared statement error`)
          
          // Force a new connection
          try {
            await client.$disconnect()
            await new Promise(resolve => setTimeout(resolve, 100 * retries))
            continue
          } catch (disconnectError) {
            console.error('Error during disconnect:', disconnectError)
          }
        }
        
        // If we've exhausted retries or it's not a prepared statement error
        if (retries === MAX_RETRIES || !error?.message?.includes('prepared statement')) {
          throw error
        }
      }
    }
  })

  return client
}

// Clean up existing connections
if (global.prisma) {
  global.prisma.$disconnect()
  global.prisma = undefined
}

const prisma = global.prisma || prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export { prisma }
