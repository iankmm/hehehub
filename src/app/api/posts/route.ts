import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Helper to verify JWT token
const verifyAuth = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export async function POST(request: Request) {
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

    // Get request body
    const { imageUrl, caption } = await request.json()

    if (!imageUrl || !caption) {
      return NextResponse.json(
        { error: 'Image URL and caption are required' },
        { status: 400 }
      )
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        imageUrl,
        caption,
        userId: payload.userId,
      },
      include: {
        user: {
          select: {
            username: true,
            heheScore: true,
          },
        },
        likes: true,
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Post creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    // Get auth token from header
    const token = request.headers.get('Authorization')?.split(' ')[1]
    let userId: string | undefined

    if (token) {
      const payload = verifyAuth(token)
      if (payload) {
        userId = payload.userId
      }
    }

    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get total count for pagination
    const totalCount = await prisma.post.count()

    // Get paginated posts ordered by creation date
    const posts = await prisma.post.findMany({
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
          where: userId ? { userId } : undefined,
        },
      },
    })

    // Transform posts to include whether the current user has liked them
    const transformedPosts = posts.map(post => ({
      id: post.id,
      imageUrl: post.imageUrl,
      caption: post.caption,
      username: post.user.username,
      heheScore: post.user.heheScore,
      likes: post.likes.length,
      hasLiked: post.likes.length > 0
    }))

    return NextResponse.json({
      posts: transformedPosts,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
