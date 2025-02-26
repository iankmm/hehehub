import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: Request) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    // Find existing user by address
    const existingUser = await prisma.user.findUnique({
      where: { address: address.toLowerCase() }
    })

    if (existingUser) {
      const token = jwt.sign({ userId: existingUser.id }, JWT_SECRET)
      return NextResponse.json({ token, user: existingUser })
    }

    // User not found
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
