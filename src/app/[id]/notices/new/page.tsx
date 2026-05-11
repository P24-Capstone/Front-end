'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export default function CreateNoticePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    notiTitle: '',
    notiContent: '',
    notiFix: 'N',
    teamId: id,
  });

  const createNoticeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/api/notices', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notices', id] });
      if (data && data.data && data.data.notiId) {
        router.push(`/${id}/notices/${data.data.notiId}`);
      } else {
        router.push(`/${id}/notices`);
      }
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || '공지 등록에 실패했습니다. (모임장만 등록 가능할 수 있습니다.)';
      alert(msg);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createNoticeMutation.mutate(formData);
  };

  return (
    <div className="pt-2 px-1">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100">
        <h1 className="text-[17px] font-bold text-zinc-900">새 공지사항 작성</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[13px] font-semibold text-zinc-800">제목</label>
          <input
            type="text"
            required
            placeholder="공지사항 제목을 입력하세요"
            className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] outline-none focus:border-[#3B3EFF] focus:bg-white transition-colors placeholder:text-zinc-400"
            value={formData.notiTitle}
            onChange={(e) => setFormData({ ...formData, notiTitle: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-semibold text-zinc-800">내용</label>
          <textarea
            required
            placeholder="공지사항 내용을 상세히 작성해 주세요."
            className="w-full h-64 p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] outline-none focus:border-[#3B3EFF] focus:bg-white transition-colors resize-none placeholder:text-zinc-400"
            value={formData.notiContent}
            onChange={(e) => setFormData({ ...formData, notiContent: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, notiFix: formData.notiFix === 'Y' ? 'N' : 'Y' })}
            className="flex items-center justify-center w-5 h-5 rounded border border-zinc-300 bg-white"
          >
            {formData.notiFix === 'Y' && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B3EFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
          <span className="text-[13px] font-medium text-zinc-700 cursor-pointer select-none"
                onClick={() => setFormData({ ...formData, notiFix: formData.notiFix === 'Y' ? 'N' : 'Y' })}>
            상단에 고정하고 필독 배지 달기
          </span>
        </div>

        <button
          type="submit"
          disabled={createNoticeMutation.isPending || !formData.notiTitle.trim() || !formData.notiContent.trim()}
          className="w-full h-[52px] mt-6 bg-black text-white rounded-xl text-[15px] font-bold disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors flex items-center justify-center"
        >
          {createNoticeMutation.isPending ? (
            <div className="w-5 h-5 border-2 border-zinc-500 border-t-white rounded-full animate-spin" />
          ) : (
            '공지 등록하기'
          )}
        </button>
      </form>
    </div>
  );
}
