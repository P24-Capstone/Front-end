'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface UserResponse {
  userId: string;
  userName: string;
  userEmail: string;
  userTel: string;
}

export default function MyPage() {
  const router = useRouter();

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/api/users/me');
      return data.data as UserResponse;
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/login');
  };

  const initial = user?.userName?.[0] ?? '?';

  return (
    <div className="w-full h-screen bg-white flex flex-col max-w-[390px] mx-auto shadow-sm overflow-hidden">
      {/* 헤더 */}
      <header className="flex items-center px-4 h-[52px] shrink-0 border-b border-zinc-100">
        <button onClick={() => router.back()} className="p-1 text-zinc-500 mr-2">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-[17px] font-bold tracking-tight">마이페이지</span>
      </header>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">불러오는 중...</div>
      ) : (
        <div className="flex flex-col flex-1">

          {/* 프사 + 이름 */}
          <div className="flex flex-col items-center py-8">
            <div className="w-20 h-20 rounded-full bg-[#C4B5FD] flex items-center justify-center mb-3">
              <span className="text-[32px] font-bold text-white">{initial}</span>
            </div>
            <p className="text-[17px] font-bold text-zinc-900">{user?.userName}</p>
          </div>

          <div className="border-t border-zinc-100" />

          {/* 상세 정보 */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[15px] font-bold text-zinc-900">상세 정보</span>
              <button
                onClick={() => router.push('/mypage/password-check')}
                className="text-[13px] font-medium text-zinc-500 border border-zinc-200 rounded-lg px-3 py-1"
              >
                수정
              </button>
            </div>
            {[
              { label: '이름', value: user?.userName },
              { label: '전화번호', value: user?.userTel },
              { label: '이메일', value: user?.userEmail },
              { label: '가입일', value: undefined },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center py-2.5">
                <span className="text-[13px] text-zinc-400 w-20 shrink-0">{label}</span>
                <span className="text-[13px] text-zinc-800">{value || '-'}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-100" />

          {/* 프로필 관리 */}
          <div className="px-5 py-4">
            <button
              onClick={() => router.push('/mypage/password-check')}
              className="w-full flex items-center py-2.5 text-left"
            >
              <span className="text-[13px] text-zinc-800">프로필 수정</span>
            </button>
            <button
              onClick={() => router.push('/auth/reset-password')}
              className="w-full flex items-center py-2.5 text-left"
            >
              <span className="text-[13px] text-zinc-800">비밀번호 변경</span>
            </button>
          </div>

          {/* 로그아웃 · 회원탈퇴 */}
          <div className="flex items-center justify-center gap-4 py-6 mt-auto">
            <button onClick={handleLogout} className="text-[13px] text-zinc-400">로그아웃</button>
            <span className="text-zinc-200">|</span>
            <button className="text-[13px] text-zinc-400">회원탈퇴</button>
          </div>

        </div>
      )}
    </div>
  );
}