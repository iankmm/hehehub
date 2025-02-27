import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('User')
      .select('id, username, heheScore')
      .order('heheScore', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    if (!users) {
      return NextResponse.json([])
    }

    // Transform the data
    const transformedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      heheScore: user.heheScore || 0 // Provide default value if null
    }))

    return NextResponse.json(transformedUsers)
  } catch (error) {
    console.error('Error fetching rankings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    )
  }
}
