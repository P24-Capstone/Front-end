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

interface UserImgResponse {
  imgId: number;
  imgFileKey: string;
}

export default function MyPageEditPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/api/users/me');
      return data.data as UserResponse;
    },
  });

  const { data: images = [] } = useQuery({
    queryKey: ['me', 'images'],
    queryFn: async () => {
      const { data } = await api.get('/api/users/me/images');
      return data.data as UserImgResponse[];
    },
  });

  const [name, setName] = useState('');
  const [tel, setTel] = useState('');

  const formatTel = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length < 4) return digits;
    if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const initialized = useRef(false);
  if (user && !initialized.current) {
    setName(user.userName ?? '');
    setTel(formatTel(user.userTel ?? ''));
    initialized.current = true;
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: () =>
      api.patch('/api/users/me', { userName: name, userTel: tel.replace(/-/g, '') }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      router.push('/mypage');
    },
    onError: (err: unknown) => {
      console.error('프로필 저장 실패', err);
      alert('저장에 실패했습니다. 다시 시도해 주세요.');
    },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data: uploadRes } = await api.post('/api/files/upload', formData);
      const imgFileKey = uploadRes.data as string;
      await api.post('/api/users/me/images', { imgFileKey });
      setPreview(imgFileKey);
      queryClient.invalidateQueries({ queryKey: ['me', 'images'] });
    } catch {
      alert('이미지 업로드에 실패했습니다. 1MB 이하 이미지만 업로드 가능합니다.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const realImages = images.filter((img) => img.imgFileKey !== 'default');
  const currentProfileUrl = realImages[realImages.length - 1]?.imgFileKey ?? null;
  const displayImg = preview ?? currentProfileUrl;
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
            <button onClick={() => !uploading && fileRef.current?.click()} className="relative group">
              <div className="w-20 h-20 rounded-full bg-[#C4B5FD] flex items-center justify-center overflow-hidden">
                {displayImg ? (
                  <img src={displayImg} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[32px] font-bold text-white">{initial}</span>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
            </button>
            <button
              onClick={() => !uploading && fileRef.current?.click()}
              className="mt-2 text-[12px] text-zinc-500 disabled:opacity-50"
            >
              {uploading ? '업로드 중...' : '이미지 변경'}
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
                placeholder=""
                className="flex-1 text-[13px] text-zinc-800 border-b border-zinc-200 outline-none py-0.5 bg-transparent"
              />
            </div>

            <div className="flex items-center py-2.5 gap-4">
              <span className="text-[13px] text-zinc-400 w-16 shrink-0">전화번호</span>
              <input
                value={tel}
                onChange={(e) => setTel(formatTel(e.target.value))}
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