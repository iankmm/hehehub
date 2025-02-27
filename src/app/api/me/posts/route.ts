import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'
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
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyAuth(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 10
    const start = (page - 1) * limit

    // Get total count for user's posts
    const { count } = await supabase
      .from('Post')
      .select('*', { count: 'exact', head: true })
      .eq('userId', payload.userId)

    // Get user's posts with pagination
    const { data: posts, error } = await supabase
      .from('Post')
      .select(`
        *,
        user:User!inner(
          username,
          heheScore
        ),
        likes:Like(
          userId
        )
      `)
      .eq('userId', payload.userId)
      .order('createdAt', { ascending: false })
      .range(start, start + limit - 1)

    if (error) {
      console.error('Error fetching user posts:', error)
      throw error
    }

    // Format posts for response
    const formattedPosts = posts?.map(post => ({
      id: post.id,
      imageUrl: post.imageUrl,
      caption: post.caption,
      likes: post.likes.length,
      username: post.user.username,
      heheScore: post.user.heheScore,
      hasLiked: post.likes.some(like => like.userId === payload.userId),
      createdAt: post.createdAt
    })) || []

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        totalPages: Math.ceil((count || 0) / limit),
        totalPosts: count
      }
    })
  } catch (error) {
    console.error('Error in GET /api/me/posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
