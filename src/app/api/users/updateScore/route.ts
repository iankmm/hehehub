import { NextResponse } from 'next/server'
import { verifyJwtToken } from '@/lib/jwt'
import { supabase } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const payload = verifyJwtToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { scoreIncrease } = await req.json()
    if (typeof scoreIncrease !== 'number' || scoreIncrease < 0) {
      return NextResponse.json({ error: 'Invalid score increase' }, { status: 400 })
    }

    const { data: currentUser, error: fetchError } = await supabase
      .from('User')
      .select('heheScore')
      .eq('id', payload.userId)
      .single()

    if (fetchError) throw fetchError

    const { data: updatedUser, error } = await supabase
      .from('User')
      .update({
        heheScore: currentUser.heheScore + scoreIncrease,
        updatedAt: new Date().toISOString()
      })
      .eq('id', payload.userId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, heheScore: updatedUser.heheScore })
  } catch (error) {
    console.error('Error updating score:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
