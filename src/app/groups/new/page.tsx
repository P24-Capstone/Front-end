'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

const INPUT_CLS = 'w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-[14px] text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-[#3B3EFF] transition-colors bg-white';
const SECTION_LABEL = 'text-[13px] font-semibold text-zinc-600 mb-2 block';

const CATEGORIES = ['독서', '스터디', '운동', '프로젝트', '친목', '기타'];

export default function CreateGroupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    teamId: '',
    teamName: '',
    teamImg: '',
    teamInfo: '',
    teamCategory: '독서',
    maxMembers: 10,
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 즉시 미리보기 표시 (업로드 완료 전에도 사용자에게 보임)
    setImagePreview(URL.createObjectURL(file));
    setImageError(null);
    setImageUploading(true);
    setFormData((prev) => ({ ...prev, teamImg: '' }));

    try {
      const form = new FormData();
      form.append('file', file);

      const { data } = await api.post<{ success: boolean; message: string; data: string }>(
        '/api/files/upload',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (!data.success) {
        throw new Error(data.message);
      }

      // 서버에서 반환된 URL을 teamImg에 저장
      setFormData((prev) => ({ ...prev, teamImg: data.data }));
    } catch (err: any) {
      setImagePreview(null);
      setImageError(err?.response?.data?.message || '이미지 업로드에 실패했습니다.');
      setFormData((prev) => ({ ...prev, teamImg: '' }));
    } finally {
      setImageUploading(false);
      // 같은 파일 재선택 가능하도록 input 초기화
      e.target.value = '';
    }
  };

  const createTeamMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/api/teams', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myTeams'] });
      if (data?.data?.teamId) {
        router.push(`/${data.data.teamId}/home`);
      } else {
        router.push('/main');
      }
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || '모임 생성에 실패했습니다.');
    },
  });

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (imageUploading) return;
    createTeamMutation.mutate(formData);
  };

  return (
    <div className="w-full h-screen bg-white flex flex-col max-w-[390px] mx-auto shadow-sm overflow-hidden">
      <header className="flex items-center px-4 h-[52px] shrink-0 border-b border-zinc-100 bg-white gap-2">
        <button onClick={() => router.back()} className="p-1 text-zinc-500">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-[17px] font-bold tracking-tight">새 모임 만들기</span>
      </header>

      <main className="flex-1 overflow-y-auto bg-zinc-100 px-4 pt-5 pb-8" style={{ scrollbarWidth: 'none' }}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* 모임 이미지 */}
          <div className="flex flex-col items-center pt-2 pb-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={imageUploading}
              className="relative group w-24 h-24 rounded-2xl overflow-hidden bg-zinc-200 flex items-center justify-center"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="모임 이미지" className="w-full h-full object-cover" />
              ) : (
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#a1a1aa" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3 3h18M8.25 9.75a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                </svg>
              )}

              {/* 업로드 중 오버레이 */}
              {imageUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                </div>
              )}

              {/* 호버 오버레이 (업로드 완료 후) */}
              {!imageUploading && (
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={imageUploading}
              className="mt-2 text-[12px] text-zinc-400 disabled:opacity-50"
            >
              {imageUploading
                ? '업로드 중...'
                : imagePreview
                  ? '이미지 변경'
                  : '이미지 추가 (선택)'}
            </button>

            {imageError && (
              <p className="mt-1 text-[11px] text-red-500">{imageError}</p>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* 모임 아이디 + 이름 */}
          <div className="bg-white rounded-xl p-4 flex flex-col gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-zinc-800 mb-1.5">
                모임 아이디 <span className="text-zinc-300 font-normal">(영문/숫자 최대 10자)</span>
              </label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="예) READCLUB"
                className={INPUT_CLS}
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value.replace(/[^a-zA-Z0-9]/g, '') })}
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-zinc-800 mb-1.5">모임 이름</label>
              <input
                type="text"
                required
                placeholder="예) 토요일 아침 독서 모임"
                className={INPUT_CLS}
                value={formData.teamName}
                onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-zinc-800 mb-1.5">모임 소개</label>
              <textarea
                required
                placeholder="어떤 모임인지 간단히 소개해 주세요."
                rows={3}
                className={`${INPUT_CLS} resize-none`}
                value={formData.teamInfo}
                onChange={(e) => setFormData({ ...formData, teamInfo: e.target.value })}
              />
            </div>
          </div>

          {/* 카테고리 */}
          <div className="px-1">
            <label className={SECTION_LABEL}>카테고리</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, teamCategory: cat })}
                  className={`py-2.5 rounded-lg text-[13px] font-medium transition-colors border ${
                    formData.teamCategory === cat
                      ? 'bg-[#3B3EFF] border-[#3B3EFF] text-white'
                      : 'bg-white border-zinc-200 text-zinc-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 최대 인원 */}
          <div className="px-1">
            <label className={SECTION_LABEL}>최대 인원</label>
            <div className="bg-white rounded-xl divide-y divide-zinc-100">
              <div className="flex items-center gap-4 px-4 py-3.5">
                <input
                  type="range"
                  min="2"
                  max="15"
                  className="flex-1 accent-[#3B3EFF]"
                  value={formData.maxMembers}
                  onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
                />
                <span className="text-[14px] font-semibold text-zinc-800 w-10 text-right shrink-0">
                  {formData.maxMembers}명
                </span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5 px-1">최소 2명에서 최대 15명까지 설정 가능합니다.</p>
          </div>

          {/* 생성 버튼 */}
          <button
            type="submit"
            disabled={
              createTeamMutation.isPending ||
              imageUploading ||
              !formData.teamId.trim() ||
              !formData.teamName.trim() ||
              !formData.teamInfo.trim()
            }
            className="mx-1 bg-[#3B3EFF] disabled:bg-zinc-300 disabled:text-white text-white text-[15px] font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center"
          >
            {createTeamMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              '모임 만들기'
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
