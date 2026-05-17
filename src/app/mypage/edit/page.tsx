'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface UserResponse {
  userId: string;
  userName: string;
  userEmail: string;
  userTel: string;
}

export default function MyPageEditPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/api/users/me');
      return data.data as UserResponse;
    },
  });

  const [name, setName] = useState('');
  const [tel, setTel] = useState('');

  const initialized = useRef(false);
  if (user && !initialized.current) {
    setName(user.userName ?? '');
    setTel(user.userTel ?? '');
    initialized.current = true;
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: () =>
      api.patch('/api/auth/me', { userName: name, userTel: tel }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      router.push('/mypage');
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  };

  const initial = user?.userName?.[0] ?? '?';

  return (
    <div className="w-full h-screen bg-white flex flex-col max-w-[390px] mx-auto shadow-sm overflow-hidden">
      <header className="flex items-center px-4 h-[52px] shrink-0 border-b border-zinc-100">
        <button onClick={() => router.push('/main')} className="p-1 text-zinc-500 mr-2">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-[17px] font-bold tracking-tight">마이페이지</span>
      </header>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">불러오는 중...</div>
      ) : (
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* 프로필 이미지 */}
          <div className="flex flex-col items-center py-8 border-b border-zinc-100">
            <button onClick={() => fileRef.current?.click()} className="relative group">
              <div className="w-20 h-20 rounded-full bg-[#C4B5FD] flex items-center justify-center overflow-hidden">
                {preview ? (
                  <img src={preview} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[32px] font-bold text-white">{initial}</span>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-2 text-[12px] text-zinc-500"
            >
              이미지 업로드
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          {/* 상세 정보 */}
          <div className="px-5 py-4">
            <span className="text-[15px] font-bold text-zinc-900 block mb-3">상세 정보</span>

            <div className="flex items-center py-2.5 gap-4">
              <span className="text-[13px] text-zinc-400 w-16 shrink-0">이름</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="flex-1 text-[13px] text-zinc-800 border-b border-zinc-200 outline-none py-0.5 bg-transparent"
              />
            </div>

            <div className="flex items-center py-2.5 gap-4">
              <span className="text-[13px] text-zinc-400 w-16 shrink-0">전화번호</span>
              <input
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                placeholder="010-0000-0000"
                className="flex-1 text-[13px] text-zinc-800 border-b border-zinc-200 outline-none py-0.5 bg-transparent"
              />
            </div>

            <div className="flex items-center py-2.5 gap-4">
              <span className="text-[13px] text-zinc-400 w-16 shrink-0">이메일</span>
              <span className="text-[13px] text-zinc-400">{user?.userEmail ?? '-'}</span>
            </div>

            <div className="flex items-center py-2.5 gap-4">
              <span className="text-[13px] text-zinc-400 w-16 shrink-0">가입일</span>
              <span className="text-[13px] text-zinc-400">-</span>
            </div>

            {/* 취소 / 완료 버튼 */}
            <div className="flex gap-3 pt-5">
              <button
                onClick={() => router.push('/mypage')}
                className="flex-1 py-3 rounded-xl text-[14px] font-medium text-zinc-600 border border-zinc-200 bg-white"
              >
                취소
              </button>
              <button
                onClick={() => save()}
                disabled={isPending}
                className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-white bg-[#3B3EFF] disabled:opacity-60"
              >
                완료
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}