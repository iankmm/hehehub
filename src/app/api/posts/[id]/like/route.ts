import { NextResponse } from 'next/server';
import { verifyJwtToken } from '../../../../../lib/jwt';
import { prisma } from '../../../../../lib/prisma';

const verifyAuth = (token: string) => {
  try {
    return verifyJwtToken(token)
  } catch {
    return null
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyAuth(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const postId = params.id

    // Create like and update heheScores in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Get the post with its author
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { user: true }
      })

      if (!post) {
        throw new Error('Post not found')
      }

      // Create the like
      const like = await prisma.like.create({
        data: {
          postId,
          userId: payload.userId,
        },
      })

      // Update liker's heheScore (person who liked gets 1 point)
      const liker = await prisma.user.update({
        where: { id: payload.userId },
        data: {
          heheScore: {
            increment: 1,
          },
        },
      })

      // Update post author's heheScore (post creator gets 1 point)
      const author = await prisma.user.update({
        where: { id: post.userId },
        data: {
          heheScore: {
            increment: 1,
          },
        },
      })

      return { 
        like,
        likerScore: liker.heheScore,
        authorScore: author.heheScore
      }
    })

    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error instanceof Error) {
      if ('code' in error && error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Already liked this post' },
          { status: 400 }
        )
      }
      console.error('Like error:', error.message);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyAuth(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const postId = params.id

    // Delete like and update heheScores in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Get the post with its author
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { user: true }
      })

      if (!post) {
        throw new Error('Post not found')
      }

      // Delete the like
      const like = await prisma.like.delete({
        where: {
          postId_userId: {
            postId,
            userId: payload.userId,
          },
        },
      })

      // Update liker's heheScore (person who unliked loses 1 point)
      const liker = await prisma.user.update({
        where: { id: payload.userId },
        data: {
          heheScore: {
            decrement: 1,
          },
        },
      })

      // Update post author's heheScore (post creator loses 1 point)
      const author = await prisma.user.update({
        where: { id: post.userId },
        data: {
          heheScore: {
            decrement: 1,
          },
        },
      })

      return {
        like,
        likerScore: liker.heheScore,
        authorScore: author.heheScore
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Unlike error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
