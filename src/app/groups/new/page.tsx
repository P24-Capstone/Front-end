'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export default function CreateGroupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    teamName: '',
    teamInfo: '',
    teamCategory: '독서',
    maxMembers: 10,
  });

  const categories = ['독서', '스터디', '운동', '프로젝트', '친목', '기타'];

  const createTeamMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/api/teams', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myTeams'] });
      if (data && data.data && data.data.teamId) {
        router.push(`/${data.data.teamId}/home`);
      } else {
        router.push('/main');
      }
    },
    onError: () => {
      alert('모임 생성에 실패했습니다.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTeamMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-[390px] mx-auto shadow-sm">
      <header className="flex items-center justify-between px-4 h-[52px] shrink-0 border-b border-zinc-100 bg-white">
        <button onClick={() => router.back()} className="p-1 -ml-1 text-zinc-500">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-[17px] font-bold tracking-tight">새 모임 만들기</span>
        <div className="w-6" /> {/* Placeholder for balance */}
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-zinc-800">모임 이름</label>
            <input
              type="text"
              required
              placeholder="예) 토요일 아침 독서 모임"
              className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] outline-none focus:border-[#3B3EFF] focus:bg-white transition-colors placeholder:text-zinc-400"
              value={formData.teamName}
              onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-zinc-800">모임 소개</label>
            <textarea
              required
              placeholder="어떤 모임인지 간단히 소개해 주세요."
              className="w-full h-32 p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] outline-none focus:border-[#3B3EFF] focus:bg-white transition-colors resize-none placeholder:text-zinc-400"
              value={formData.teamInfo}
              onChange={(e) => setFormData({ ...formData, teamInfo: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-zinc-800">카테고리</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, teamCategory: cat })}
                  className={`h-11 rounded-lg text-[13px] font-medium transition-colors ${
                    formData.teamCategory === cat
                      ? 'bg-[#3B3EFF] text-white'
                      : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-zinc-800">최대 인원</label>
            <div className="flex items-center gap-4 bg-zinc-50 border border-zinc-200 rounded-xl px-4 h-12">
              <input
                type="range"
                min="2"
                max="15"
                className="flex-1 accent-[#3B3EFF]"
                value={formData.maxMembers}
                onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
              />
              <span className="text-[14px] font-medium text-zinc-800 w-8 text-right">
                {formData.maxMembers}명
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">최소 2명에서 최대 15명까지 설정 가능합니다.</p>
          </div>

          <button
            type="submit"
            disabled={createTeamMutation.isPending || !formData.teamName.trim() || !formData.teamInfo.trim()}
            className="w-full h-[52px] mt-4 bg-black text-white rounded-xl text-[15px] font-bold disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors flex items-center justify-center"
          >
            {createTeamMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-zinc-500 border-t-white rounded-full animate-spin" />
            ) : (
              '모임 만들기'
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
