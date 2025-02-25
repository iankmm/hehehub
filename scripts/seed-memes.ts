import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

const funnyDescriptions = [
  "When the code finally works but you don't know why 😅",
  "That moment when you realize it's not a bug, it's a feature 🤔",
  "Me explaining my code to my rubber duck 🦆",
  "POV: You forgot a semicolon and spent 2 hours debugging",
  "When someone asks if I tested my code before pushing",
  "My code in production vs my code in development",
  "Friday deploy? Challenge accepted! 🚀",
  "When the client says 'just one small change'",
  "Documentation? Never heard of her 📚",
  "When you find your old code and it actually makes sense",
  "Coffee.js has stopped working ☕",
  "404: Motivation not found",
  "When you accidentally fix a bug by deleting your code",
  "git commit -m 'I hope this works'",
  "When the senior dev reviews your pull request",
]

async function main() {
  // Get the first user
  const user = await prisma.user.findFirst()
  if (!user) {
    console.log('No user found! Please create a user first.')
    return
  }

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  // Get all image files
  const imgDir = path.join(process.cwd(), 'meme', 'img')
  const files = fs.readdirSync(imgDir)
    .filter(file => file.endsWith('.jpg'))

  // Copy each file to uploads and create a post
  for (const file of files) {
    // Copy file to uploads directory
    fs.copyFileSync(
      path.join(imgDir, file),
      path.join(uploadsDir, file)
    )

    // Create post with the new path
    const description = funnyDescriptions[Math.floor(Math.random() * funnyDescriptions.length)]
    await prisma.post.create({
      data: {
        imageUrl: `/uploads/${file}`,
        caption: description,
        userId: user.id
      }
    })
    console.log('Created post with image:', file)
  }

  console.log('Done seeding memes!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
