'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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

export default function MyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/api/users/me');
      return data.data as UserResponse;
    },
  });

  const {
    data: images = [],
    isLoading: imagesLoading,
    refetch: refetchImages,
  } = useQuery({
    queryKey: ['me', 'images'],
    queryFn: async () => {
      const { data } = await api.get('/api/users/me/images');
      return data.data as UserImgResponse[];
    },
  });

  const handleImageDelete = async (imgId: number) => {
    try {
      await api.delete(`/api/users/me/images/${imgId}`);
      await refetchImages();
    } catch {
      setUploadError('이미지 삭제에 실패했습니다.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data: uploadRes } = await api.post('/api/files/upload?type=profile', formData);
      const imgFileKey = uploadRes.data as string;
      await api.post('/api/users/me/images', { imgFileKey });
      await refetchImages();
    } catch {
      setUploadError('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/login');
  };

  const formatTel = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (d.length < 4) return d;
    if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  };

  const realImages = images.filter((img) => img.imgFileKey !== 'default');
  const profileImgUrl = realImages[realImages.length - 1]?.imgFileKey ?? null;
  const initial = user?.userName?.[0] ?? '?';

  return (
    <div className="w-full h-screen bg-white flex flex-col max-w-[390px] mx-auto shadow-sm overflow-hidden">
      {/* 헤더 */}
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

          {/* 프사 + 이름 */}
          <div className="flex flex-col items-center py-8">
            <div className="w-20 h-20 rounded-full bg-[#C4B5FD] flex items-center justify-center mb-3 overflow-hidden">
              {profileImgUrl ? (
                <img src={profileImgUrl} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[32px] font-bold text-white">{initial}</span>
              )}
            </div>
            <p className="text-[17px] font-bold text-zinc-900">{user?.userName}</p>
          </div>

          <div className="border-t border-zinc-100" />

          {/* 상세 정보 */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[15px] font-bold text-zinc-900">내 정보</span>
              <button
                onClick={() => router.push('/mypage/password-check')}
                className="text-[13px] font-medium text-zinc-500 border border-zinc-200 rounded-lg px-3 py-1"
              >
                수정
              </button>
            </div>
            {[
              { label: '이름', value: user?.userName },
              { label: '전화번호', value: user?.userTel ? formatTel(user.userTel) : undefined },
              { label: '이메일', value: user?.userEmail },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center py-2.5">
                <span className="text-[13px] text-zinc-400 w-20 shrink-0">{label}</span>
                <span className="text-[13px] text-zinc-800">{value || '-'}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-100" />
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[15px] font-bold text-zinc-900">내 프로필 이미지</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-[13px] font-medium text-zinc-500 border border-zinc-200 rounded-lg px-3 py-1 disabled:opacity-50"
              >
                {uploading ? '업로드 중...' : '추가'}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            {uploadError && (
              <p className="text-[12px] text-red-500 mb-2">{uploadError}</p>
            )}
            {imagesLoading ? (
              <p className="text-[13px] text-zinc-400">불러오는 중...</p>
            ) : realImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {realImages.map((img) => (
                  <div key={img.imgId} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-100 group">
                    <img src={img.imgFileKey} alt="프로필 이미지" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleImageDelete(img.imgId)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="이미지 삭제"
                    >
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-zinc-400">등록된 이미지가 없습니다.</p>
            )}
          </div>

          <div className="border-t border-zinc-100" />

          {/* 프로필 관리 */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[15px] font-bold text-zinc-900">설정</span>
            </div>
            <button
              onClick={() => router.push('/auth/reset-password')}
              className="w-full flex items-center py-2.5 text-left"
            >
              <span className="text-[13px] text-zinc-800">비밀번호 변경</span>
            </button>
            <button onClick={handleLogout} className="w-full flex items-center py-2.5 text-left text-[13px] text-zinc-800">로그아웃</button>
            <button className="w-full flex items-center py-2.5 text-left text-[13px] text-zinc-800" onClick={() => router.push('/mypage/withdrawal')}>회원탈퇴</button>
          </div>
        </div>
      )}
    </div>
  );
}