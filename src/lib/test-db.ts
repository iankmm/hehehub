import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Verify environment variables are loaded
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // Test User table
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('*')
      .limit(1)

    console.log('User table:', userData || 'empty')
    if (userError) console.error('User table error:', userError)

    // Test Post table
    const { data: postData, error: postError } = await supabase
      .from('Post')
      .select('*')
      .limit(1)

    console.log('Post table:', postData || 'empty')
    if (postError) console.error('Post table error:', postError)

    // Test Like table
    const { data: likeData, error: likeError } = await supabase
      .from('Like')
      .select('*')
      .limit(1)

    console.log('Like table:', likeData || 'empty')
    if (likeError) console.error('Like table error:', likeError)

  } catch (error) {
    console.error('Database connection failed:', error)
  }
}

testConnection() 