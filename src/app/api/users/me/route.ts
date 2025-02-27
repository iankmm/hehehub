import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'
import { verifyJwtToken } from '@/lib/jwt'

const verifyAuth = (token: string) => {
  try {
    return verifyJwtToken(token)
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  try {
    // Get the token from the Authorization header
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyAuth(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user data including their heheScore
    const { data: user, error } = await supabase
      .from('User')
      .select(`
        id,
        username,
        address,
        heheScore
      `)
      .eq('id', payload.userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error in /api/users/me:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
