import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-admin';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const verifyAuth = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
};

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuth(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // First get the post IDs that the user has liked
    const { data: likedPostIds, error: likesError } = await supabase
      .from('Like')
      .select('postId')
      .eq('userId', payload.userId);

    if (likesError) throw likesError;

    // If no likes found, return empty array
    if (!likedPostIds || likedPostIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get all posts that the user has liked
    const { data: likedPosts, error } = await supabase
      .from('Post')
      .select(`
        *,
        user:User(username, heheScore),
        likes:Like!inner(userId, reaction_image_url)
      `)
      .in('id', likedPostIds.map(like => like.postId))
      .order('createdAt', { ascending: false });

    if (error) throw error;

    // Format posts to include hasLiked flag and reaction_image_url
    const formattedPosts = likedPosts.map(post => ({
      ...post,
      hasLiked: true,
      likes: post.likes.length,
      // Get the reaction_image_url from the Like record for this user
      reaction_image_url: post.likes.find(like => like.userId === payload.userId)?.reaction_image_url
    }));

    return NextResponse.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching liked posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 