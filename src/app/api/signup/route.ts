import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createJwtToken } from '@/lib/jwt'

export async function POST(request: Request) {
  try {
    const { username, address } = await request.json()

    // Validate input
    if (!username || !address) {
      return NextResponse.json({ message: 'Username and address are required' }, { status: 400 })
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username
      }
    })

    if (existingUser) {
      return NextResponse.json({ message: 'Username is already taken' }, { status: 400 })
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        username,
        address: address.toLowerCase(),
        heheScore: 0
      }
    })

    // Generate JWT token
    const token = createJwtToken({
      id: user.id,
      username: user.username,
      address: user.address
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        address: user.address,
        heheScore: user.heheScore
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
