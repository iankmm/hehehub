import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-admin';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const verifyAuth = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
};

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
 
    const payload = verifyAuth(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const params = await context.params

    const postId = params.id;

    // Get the post with its author
    const { data: post, error: postError } = await supabase
      .from('Post')
      .select('*, user:User(*)')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Create like with a unique ID
    const { data: like, error: likeError } = await supabase
      .from('Like')
      .insert({
        id: uuidv4(),
        postId,
        userId: payload.userId,
        createdAt: new Date().toISOString()
      })
      .select()
      .single();

    if (likeError) {
      if (likeError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Already liked this post' },
          { status: 400 }
        );
      }
      throw likeError;
    }

    // Update liker's heheScore
    const { data: liker, error: likerError } = await supabase.rpc('increment_hehe_score', {
      user_id: payload.userId
    });
    if (likerError) throw likerError;

    // Update post author's heheScore
    const { data: author, error: authorError } = await supabase.rpc('increment_hehe_score', {
      user_id: post.userId
    });
    if (authorError) throw authorError;

    return NextResponse.json({
      like,
      likerScore: liker.hehe_score,
      authorScore: author.hehe_score
    });
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    const postId = await params.id

    // Get the post with its author
    const { data: post, error: postError } = await supabase
      .from('Post')
      .select('*, user:User(*)')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Delete like
    const { data: like, error: likeError } = await supabase
      .from('Like')
      .delete()
      .match({ postId, userId: payload.userId })
      .select()
      .single()

    if (likeError) throw likeError

    // Update liker's heheScore
    const { data: liker, error: likerError } = await supabase.rpc('decrement_hehe_score', {
      user_id: payload.userId
    })
    if (likerError) throw likerError

    // Update post author's heheScore
    const { data: author, error: authorError } = await supabase.rpc('decrement_hehe_score', {
      user_id: post.userId
    })
    if (authorError) throw authorError

    return NextResponse.json({
      like,
      likerScore: liker.hehe_score,
      authorScore: author.hehe_score
    })
  } catch (error) {
    console.error('Unlike error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
