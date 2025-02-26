import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'
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

    const { data: post, error } = await supabase
      .from('Post')
      .insert({
        imageUrl,
        caption,
        userId: payload.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select('*, user:User(username, heheScore)')
      .single()

    if (error) throw error

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
    const start = (page - 1) * limit

    // Get total count
    const { count } = await supabase
      .from('Post')
      .select('*', { count: 'exact', head: true })

    // Get paginated posts
    const { data: posts, error } = await supabase
      .from('Post')
      .select(`
        *,
        user:User(username, heheScore),
        likes:Like(userId)
      `)
      .order('createdAt', { ascending: false })
      .range(start, start + limit - 1)

    if (error) throw error

    // Format posts for response
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      imageUrl: post.imageUrl,
      caption: post.caption,
      likes: post.likes.length,
      username: post.user.username,
      heheScore: post.user.heheScore,
      hasLiked: userId ? post.likes.some(like => like.userId === userId) : false,
      createdAt: post.createdAt,
    }))

    return NextResponse.json({
      posts: formattedPosts,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
