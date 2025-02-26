import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: Request) {
  try {
    const { address, username } = await request.json()

    if (!address || !username) {
      return NextResponse.json(
        { error: 'Address and username are required' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const userWithUsername = await prisma.user.findUnique({
      where: { username }
    })

    if (userWithUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      )
    }

    // Check if user with this address already exists
    const existingUser = await prisma.user.findUnique({
      where: { address: address.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        address: address.toLowerCase(),
        username
      }
    })

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET)
    return NextResponse.json({ token, user: newUser })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
