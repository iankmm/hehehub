'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import CreatePost from '@/components/CreatePost';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const ImageReel = dynamic(() => import('@/components/ImageReel'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-[#1f1f1f] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-white">Loading memes...</p>
      </div>
    </div>
  )
});

interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  likes: number;
  username: string;
  heheScore: number;
  hasLiked: boolean;
  createdAt: string;
  user?: {
    username: string;
    heheScore: number;
  }
}

interface PostsResponse {
  posts: Post[];
  totalPages: number;
  currentPage: number;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchPosts = async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found in fetchPosts');
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/posts?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          console.log('Unauthorized in fetchPosts');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch posts');
      }

      const data: PostsResponse = await res.json();
      if (page === 1) {
        setPosts(data.posts);
      } else {
        setPosts((prevPosts) => [...prevPosts, ...data.posts]);
      }
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts');
    } finally {
      setIsLoading(false);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found in useEffect');
      router.push('/login');
      return;
    }
    fetchPosts(1);
  }, [router]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#1f1f1f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-[#1f1f1f]">
        {posts.length > 0 ? (
          <ImageReel images={posts} onEndReached={() => {
            if (!isLoading && currentPage < totalPages) {
              fetchPosts(currentPage + 1);
            }
          }} />
        ) : error ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <p className="text-red-500">{error}</p>
              <button
                onClick={() => fetchPosts(1)}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-400">No memes yet. Be the first to post!</p>
          </div>
        )}

        {showCreatePost && (
          <CreatePost
            isOpen={showCreatePost}
            setIsOpen={setShowCreatePost}
            onPostCreated={(newPost) => {
              setPosts((prevPosts) => [newPost, ...prevPosts])
            }}
          />
        )}
      </div>
  );
}
