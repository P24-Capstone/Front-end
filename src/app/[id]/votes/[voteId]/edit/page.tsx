'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHeaderSlotStore } from '@/store/headerSlot';
import api from '@/lib/api';

const INPUT_CLS =
  'w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-[14px] text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-[#3B3EFF] transition-colors bg-white';

interface EditableOption {
  optSn?: number;      // 기존 선택지는 서버 ID 보유, 신규는 undefined
  optContent: string;
  voteCount: number;   // 이미 투표된 수
}

export default function VoteEditPage() {
  const { id, voteId } = useParams<{ id: string; voteId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setPageHeader } = useHeaderSlotStore();

  const [title,   setTitle]   = useState('');
  const [content, setContent] = useState('');
  const [endDate, setEndDate] = useState('');
  const [options, setOptions] = useState<EditableOption[]>([]);

  /* ── 데이터 로드 ── */
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
      if (Array.isArray(vote.options) && vote.options.length > 0) {
        setOptions(
          vote.options.map((o: any) => ({
            optSn:       o.optSn,
            optContent:  o.optContent ?? '',
            voteCount:   o.voteCount  ?? 0,
          }))
        );
      }
    }
  }, [vote]);

  /* ── 선택지 편집 핸들러 ── */
  const addOption = () =>
    setOptions((prev) => [...prev, { optContent: '', voteCount: 0 }]);

  const removeOption = (idx: number) =>
    setOptions((prev) => prev.filter((_, i) => i !== idx));

  const updateOption = (idx: number, val: string) =>
    setOptions((prev) =>
      prev.map((o, i) => (i === idx ? { ...o, optContent: val } : o))
    );

  /* ── 저장 mutation ── */
  const updateMutation = useMutation({
    mutationFn: () =>
      api.patch(`/api/votes/${voteId}`, {
        voteTitle:   title.trim(),
        voteContent: content.trim() || title.trim(),
        voteEndDt:   endDate,
        options: options
          .filter((o) => o.optContent.trim() !== '')
          .map((o) => ({
            ...(o.optSn !== undefined ? { optSn: o.optSn } : {}),
            optContent: o.optContent.trim(),
          })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes', id] });
      queryClient.invalidateQueries({ queryKey: ['vote', voteId] });
      router.back();
    },
    onError: () => alert('수정에 실패했습니다. 다시 시도해 주세요.'),
  });

  const filledOptions = options.filter((o) => o.optContent.trim() !== '');
  const hasLockedOptions = options.some((o) => o.voteCount > 0);
  const isDisabled =
    !title.trim() ||
    !endDate ||
    filledOptions.length < 2 ||
    updateMutation.isPending;

  /* ── 로딩 ── */
  if (isLoading) {
    return (
      <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 flex items-center justify-center">
        <p className="text-[14px] text-zinc-400">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex flex-col gap-4">

      {/* ── 제목 + 설명 ── */}
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

      {/* ── 선택지 ── */}
      <div className="bg-white rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-[13px] font-medium text-zinc-500">선택지</label>
          {hasLockedOptions && (
            <span className="text-[11px] text-amber-500">투표된 항목은 수정 불가</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {options.map((opt, idx) => {
            const locked = opt.voteCount > 0;
            return (
              <div key={idx} className="flex items-center gap-2">
                {/* 번호 뱃지 */}
                <span className="w-5 h-5 shrink-0 rounded text-[11px] font-bold bg-zinc-100 text-zinc-400 flex items-center justify-center">
                  {idx + 1}
                </span>

                {/* 입력 필드 */}
                <div className="relative flex-1">
                  <input
                    value={opt.optContent}
                    onChange={(e) => !locked && updateOption(idx, e.target.value)}
                    placeholder={`선택지 ${idx + 1}`}
                    readOnly={locked}
                    className={`${INPUT_CLS} ${locked ? 'bg-zinc-50 text-zinc-400 cursor-not-allowed pr-12' : ''}`}
                  />
                  {locked && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-zinc-400">
                      {opt.voteCount}표
                    </span>
                  )}
                </div>

                {/* 삭제 버튼 — 잠금 해제 & 최소 2개 초과 시만 표시 */}
                {!locked && filledOptions.length > 2 && (
                  <button
                    onClick={() => removeOption(idx)}
                    className="w-6 h-6 shrink-0 bg-zinc-200 text-zinc-500 hover:bg-zinc-300 rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* 선택지 추가 버튼 */}
        <button
          onClick={addOption}
          className="w-full mt-3 border border-dashed border-zinc-300 rounded-lg py-2.5 text-[13px] text-zinc-400 flex items-center justify-center gap-1.5 hover:border-zinc-400 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          선택지 추가
        </button>

        {filledOptions.length < 2 && (
          <p className="text-[11px] text-red-400 mt-2">선택지는 최소 2개 이상 필요합니다.</p>
        )}
      </div>

      {/* ── 마감 일시 ── */}
      <div className="bg-white rounded-xl p-4">
        <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">마감 일시</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className={INPUT_CLS}
        />
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
