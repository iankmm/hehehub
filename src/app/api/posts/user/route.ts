import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'
import { verifyJwtToken } from '@/lib/jwt'

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      console.log('No token provided')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyJwtToken(token)
    if (!payload) {
      console.log('Invalid token')
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 10
    const start = (page - 1) * limit

    // Get total count
    const { count } = await supabase
      .from('Post')
      .select('*', { count: 'exact', head: true })
      .eq('userId', payload.userId)

    // Get user's posts with pagination
    const { data: posts, error } = await supabase
      .from('Post')
      .select(`
        *,
        user:User(username, heheScore),
        likes:Like(userId)
      `)
      .eq('userId', payload.userId)
      .order('createdAt', { ascending: false })
      .range(start, start + limit - 1)

    if (error) throw error

    return NextResponse.json({
      posts,
      pagination: {
        page,
        totalPages: Math.ceil((count || 0) / limit),
        totalPosts: count
      }
    })
  } catch (error) {
    console.error('Error in GET /api/posts/user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
