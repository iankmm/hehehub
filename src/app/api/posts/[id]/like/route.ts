import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

const verifyAuth = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyAuth(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const postId = params.id

    // Create like and update user's heheScore in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create the like
      const like = await prisma.like.create({
        data: {
          postId,
          userId: payload.userId,
        },
      })

      // Update user's heheScore
      const user = await prisma.user.update({
        where: { id: payload.userId },
        data: {
          heheScore: {
            increment: 10,
          },
        },
      })

      return { like, heheScore: user.heheScore }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Already liked this post' },
        { status: 400 }
      )
    }
    console.error('Like error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyAuth(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const postId = params.id

    // Delete like and update user's heheScore in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Delete the like
      const like = await prisma.like.delete({
        where: {
          postId_userId: {
            postId,
            userId: payload.userId,
          },
        },
      })

      // Update user's heheScore
      const user = await prisma.user.update({
        where: { id: payload.userId },
        data: {
          heheScore: {
            decrement: 10,
          },
        },
      })

      return { like, heheScore: user.heheScore }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Like not found' },
        { status: 404 }
      )
    }
    console.error('Unlike error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
