'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AuthWrapper from '@/components/AuthWrapper';
import CreatePost from '@/components/CreatePost';

const ImageReel = dynamic(() => import('@/components/ImageReel'), {
  ssr: false
});

interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  likes: number;
  username: string;
  heheScore: number;
  hasLiked: boolean;
}

interface PostsResponse {
  posts: Post[];
  totalPages: number;
  currentPage: number;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPosts = async (page: number) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/posts?page=${page}&limit=10`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data: PostsResponse = await res.json();
        if (page === 1) {
          setPosts(data.posts);
        } else {
          setPosts(prevPosts => [...prevPosts, ...data.posts]);
        }
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

  const formattedPosts = posts.map(post => ({
    id: post.id,
    imageUrl: post.imageUrl,
    caption: post.caption,
    likes: post.likes,
    username: post.username,
    heheScore: post.heheScore,
    hasLiked: post.hasLiked
  }));

  const handleLoadMore = () => {
    if (!isLoading && currentPage < totalPages) {
      fetchPosts(currentPage + 1);
    }
  };

  return (
    <AuthWrapper>
      <div className="relative">
        {posts.length === 0 ? (
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-white text-xl mb-2">No memes yet</h2>
              <p className="text-gray-400">Be the first to post a meme!</p>
            </div>
          </div>
        ) : (
          <ImageReel images={formattedPosts} onEndReached={handleLoadMore} />
        )}
        <CreatePost />
      </div>
    </AuthWrapper>
  );
}
