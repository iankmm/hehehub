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

export async function GET(request: Request) {
  try {
    // Get auth token from header
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token
    const payload = verifyAuth(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get total count for pagination
    const totalCount = await prisma.post.count({
      where: {
        userId: payload.userId
      }
    })

    // Get paginated posts ordered by creation date
    const posts = await prisma.post.findMany({
      where: {
        userId: payload.userId
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            username: true,
            heheScore: true,
          },
        },
        likes: {
          where: {
            userId: payload.userId,
          },
          take: 1,
        },
      },
    })

    // Format posts for response
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      imageUrl: post.imageUrl,
      caption: post.caption,
      likes: post._count?.likes || 0,
      username: post.user.username,
      heheScore: post.user.heheScore,
      hasLiked: post.likes.length > 0,
      createdAt: post.createdAt,
    }))

    return NextResponse.json({
      posts: formattedPosts,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    })
  } catch (error) {
    console.error('Error fetching user posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
