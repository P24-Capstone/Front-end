'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function PasswordCheckPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/api/users/me');
      return data.data as { userEmail: string };
    },
  });

  const handleConfirm = async () => {
    if (!user?.userEmail) return;
    try {
      await api.post('/api/auth/login', { userEmail: user.userEmail, userPw: password });
      router.push('/mypage/edit');
    } catch {
      setError(true);
    }
  };

  return (
    <div className="w-full h-screen bg-zinc-100 flex flex-col max-w-[390px] mx-auto">
      <header className="flex items-center px-4 h-[52px] shrink-0 bg-white border-b border-zinc-100">
        <button onClick={() => router.back()} className="p-1 text-zinc-500 mr-2">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-[17px] font-bold tracking-tight">마이페이지</span>
      </header>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl w-full px-8 py-10 flex flex-col items-center">
          <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} className="text-zinc-800 mb-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>

          <p className="text-[15px] font-semibold text-zinc-900 text-center leading-relaxed mb-6">
            개인정보 보호를 위해<br />비밀번호를 다시 확인합니다
          </p>

          <div className="w-full mb-4">
            <input
              type="password"
              placeholder="비밀번호를 입력해 주세요"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              className={`w-full border rounded-lg px-4 py-3 text-[13px] outline-none ${
                error ? 'border-red-400' : 'border-zinc-200'
              }`}
            />
            {error && (
              <p className="text-[12px] text-red-500 mt-1">비밀번호가 일치하지 않습니다</p>
            )}
          </div>

          <button
            onClick={handleConfirm}
            className="bg-[#3B3EFF] text-white text-[14px] font-semibold rounded-xl px-12 py-3"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}