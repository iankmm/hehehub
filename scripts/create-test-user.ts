import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
  const { data: user, error } = await supabase
    .from('User')
    .upsert({
      id: 'test-user-1',
      address: '0x1234567890123456789012345678901234567890',
      username: 'testuser',
      heheScore: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating user:', error)
    return
  }

  console.log('Created test user:', user)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
