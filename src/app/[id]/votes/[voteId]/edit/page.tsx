'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHeaderSlotStore } from '@/store/headerSlot';
import api from '@/lib/api';

const INPUT_CLS = 'w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-[14px] text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-[#3B3EFF] transition-colors bg-white';

export default function VoteEditPage() {
  const { id, voteId } = useParams<{ id: string; voteId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setPageHeader } = useHeaderSlotStore();

  const [title,   setTitle]   = useState('');
  const [content, setContent] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: vote, isLoading } = useQuery({
    queryKey: ['vote', voteId],
    queryFn: async () => {
      const { data } = await api.get(`/api/votes/${voteId}`);
      return data.data;
    },
    enabled: !!voteId,
  });

  useEffect(() => {
    setPageHeader({ title: '투표 수정', hideHamburger: true });
    return () => setPageHeader(null);
  }, [setPageHeader]);

  useEffect(() => {
    if (vote) {
      setTitle(vote.voteTitle ?? '');
      setContent(vote.voteContent ?? '');
      setEndDate(vote.voteEndDt ?? '');
    }
  }, [vote]);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.patch(`/api/votes/${voteId}`, {
        voteTitle:  title.trim(),
        voteContent: content.trim() || title.trim(),
        voteEndDt:  endDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes', id] });
      queryClient.invalidateQueries({ queryKey: ['vote', voteId] });
      router.back();
    },
    onError: () => alert('수정에 실패했습니다. 다시 시도해 주세요.'),
  });

  const isDisabled = !title.trim() || !endDate || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 flex items-center justify-center">
        <p className="text-[14px] text-zinc-400">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex flex-col gap-4">

      <div className="bg-white rounded-xl p-4 flex flex-col gap-4">
        <div>
          <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">투표 제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="투표 제목을 입력하세요"
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">
            상세 내용 <span className="text-zinc-300 font-normal">(선택)</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="투표에 대한 설명을 입력하세요"
            rows={3}
            className={`${INPUT_CLS} resize-none`}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl p-4">
        <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">마감 일시</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className={INPUT_CLS}
        />
        <p className="text-[11px] text-zinc-400 mt-1.5">선택지와 투표 결과는 변경할 수 없습니다.</p>
      </div>

      <button
        disabled={isDisabled}
        onClick={() => updateMutation.mutate()}
        className="w-full h-[52px] bg-[#3B3EFF] text-white rounded-2xl text-[15px] font-bold disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors mt-2"
      >
        {updateMutation.isPending ? '수정 중...' : '수정 완료'}
      </button>
    </div>
  );
}
