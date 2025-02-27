import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabase-admin'

async function upload_image_local(file: File) {
  // Get file extension and generate unique name
  const ext = file.name.split('.').pop()
  const fileName = `${uuidv4()}.${ext}`

  // Create uploads directory if it doesn't exist
  const uploadDir = join(process.cwd(), 'public/uploads')
  try {
    await writeFile(join(uploadDir, '.keep'), '')
  } catch (error) {
    // Directory already exists
  }

  // Convert File to Buffer
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Save file
  const filePath = join(uploadDir, fileName)
  await writeFile(filePath, buffer)

  return  `/uploads/${fileName}`
} 

async function upload_image_supabase(file: File) {
  try {
    // Generate unique file name
    const ext = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${ext}`

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('memes')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('memes')
      .getPublicUrl(fileName)
    
    console.log("publicUrl", publicUrl)

    return publicUrl
  } catch (error) {
    console.error('Supabase upload error:', error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    // Check auth first
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    const image_url = await upload_image_supabase(file)

    return NextResponse.json({ 
      url: image_url
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Error uploading file' },
      { status: 500 }
    )
  }
}
