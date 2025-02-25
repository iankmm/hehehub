'use client';

import dynamic from 'next/dynamic';
import AuthWrapper from '@/components/AuthWrapper';
import { useAccount, useDisconnect } from 'wagmi';

const ImageReel = dynamic(() => import('@/components/ImageReel'), {
  ssr: false
});

// Mock data using real meme templates from Imgflip
const mockImages = [
  {
    id: '1',
    url: 'https://i.imgflip.com/1bij.jpg', // "One Does Not Simply" meme
    caption: 'One does not simply write bug-free code 😅 #CodingLife',
    likes: 45234,
    username: 'meme.dev'
  },
  {
    id: '2',
    url: 'https://i.imgflip.com/26am.jpg', // "Futurama Fry" meme
    caption: 'Not sure if good code or just lucky it works 🤔 #ProgrammerLife',
    likes: 38456,
    username: 'debug.master'
  },
  {
    id: '3',
    url: 'https://i.imgflip.com/1bgw.jpg', // "Batman Slapping Robin" meme
    caption: 'When someone suggests adding jQuery to a React project 🦇 #WebDev',
    likes: 52921,
    username: 'meme.coder'
  },
  {
    id: '4',
    url: 'https://i.imgflip.com/9vct.jpg', // "Doge" meme
    caption: 'Much code, very bugs, wow 🐕 #DevLife',
    likes: 41245,
    username: 'code.memez'
  },
  {
    id: '5',
    url: 'https://i.imgflip.com/1bh8.jpg', // "Y U NO" meme
    caption: 'Y U NO USE TYPESCRIPT??? 😤 #TypeScript',
    likes: 47891,
    username: 'devops.memes'
  },
  {
    id: '6',
    url: 'https://i.imgflip.com/1ihzfe.jpg', // "Roll Safe" meme
    caption: 'Can\'t have bugs if you don\'t write code 🤯 #BigBrain',
    likes: 62156,
    username: 'frontend.fun'
  },
  {
    id: '7',
    url: 'https://i.imgflip.com/1g8my4.jpg', // "Evil Kermit" meme
    caption: 'Me: Test the code\nAlso me: Push to production 🐸 #YOLO',
    likes: 55789,
    username: 'stackoverflow.memes'
  },
  {
    id: '8',
    url: 'https://i.imgflip.com/2hgfw.jpg', // "This is Fine" meme
    caption: 'When production is on fire but it\'s Friday at 4:59 PM 🔥 #DevOps',
    likes: 49876,
    username: 'bug.finder'
  },
  {
    id: '9',
    url: 'https://i.imgflip.com/30b1gx.jpg', // "Drake" meme
    caption: 'Writing documentation 👎\nWriting more code that needs documentation 👍 #DevLife',
    likes: 65123,
    username: 'git.master'
  },
  {
    id: '10',
    url: 'https://i.imgflip.com/28j0te.jpg', // "Surprised Pikachu" meme
    caption: 'When you delete node_modules and npm install fixes everything 😮 #JavaScript',
    likes: 53567,
    username: 'tech.humor'
  }
];

export default function Home() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <AuthWrapper>
      <div className="relative">
        <ImageReel images={mockImages} />
        

      </div>
    </AuthWrapper>
  );
}
