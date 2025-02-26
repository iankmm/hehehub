import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJwtToken } from '@/lib/jwt'

//const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: Request) {
  try {
    // Get auth token from header
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      console.log('No token provided')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token
    const payload = verifyJwtToken(token)
    if (!payload) {
      console.log('Invalid token')
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    console.log('Fetching posts for user:', payload.userId)

    // Get page from URL params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 10
    const skip = (page - 1) * limit

    // Get user's posts with pagination
    const posts = await prisma.post.findMany({
      where: {
        userId: payload.userId,
      },
      include: {
        user: {
          select: {
            username: true,
            heheScore: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    console.log('Found posts:', posts.length)

    // Get total count for pagination
    const totalPosts = await prisma.post.count({
      where: {
        userId: payload.userId,
      },
    })

    console.log('Total posts:', totalPosts)

    return NextResponse.json({
      posts,
      pagination: {
        page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/posts/user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
