import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'
import { createJwtToken } from '@/lib/jwt'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const { username, address } = await request.json()

    // Validate input
    if (!username || !address) {
      return NextResponse.json({ message: 'Username and address are required' }, { status: 400 })
    }

    // Check if username is already taken
    const { data: existingUser, error: checkError } = await supabase
      .from('User')
      .select()
      .eq('username', username)
      .single()

    if (existingUser) {
      return NextResponse.json({ message: 'Username is already taken' }, { status: 400 })
    }

    // Create new user
    const userId = uuidv4()
    const { data: user, error: createError } = await supabase
      .from('User')
      .insert({
        id: userId,
        username,
        address: address.toLowerCase(),
        heheScore: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('User creation error:', createError)
      return NextResponse.json({ message: 'Error creating user' }, { status: 500 })
    }

    // Generate JWT token
    const token = createJwtToken({
      id: user.id,
      username: user.username,
      address: user.address
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        address: user.address,
        heheScore: user.heheScore
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
