import { NextResponse } from 'next/server'
import { verifyJwtToken } from '@/lib/jwt'
import { supabase } from '@/lib/supabase-admin'

export async function GET(req: Request) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const payload = verifyJwtToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get posts with a count of their likes
    const { data: posts, error: postsError } = await supabase
      .from('Post')
      .select('*, likes:Like(count)')

    if (postsError) {
      console.error('Posts error:', postsError)
      throw postsError
    }

    // Transform posts to include like count
    const transformedPosts = posts.map(post => ({
      ...post,
      likes: post.likes?.[0]?.count || 0
    }))

    console.log('Posts with likes:', transformedPosts)
    return NextResponse.json({ posts: transformedPosts })
  } catch (error) {
    console.error('Error in /api/posts/all:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
