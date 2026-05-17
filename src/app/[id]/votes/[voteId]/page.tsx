'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface VoteOption {
  optSn: number;
  optContent: string;
  voteCount: number;
}

interface VoteResponse {
  voteId: number;
  voteTitle: string;
  voteContent: string;
  voteStartDt: string;
  voteEndDt: string;
  voteType: string;
  voteRule: string;
  voteMulti: string;
  voteRegDtm: string;
  teamId: string;
  options: VoteOption[];
}

function VoteResultsView({ vote }: { vote: VoteResponse }) {
  const totalVotes = vote.options.reduce((sum, o) => sum + o.voteCount, 0);
  const maxCount = Math.max(...vote.options.map((o) => o.voteCount), 1);

  return (
    <div className="flex flex-col gap-5">
      {vote.options.map((option, idx) => {
        const isTop = option.voteCount === maxCount && option.voteCount > 0;
        const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;

        return (
          <div key={option.optSn} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center shrink-0 ${isTop ? 'bg-[#3B3EFF] text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                {idx + 1}
              </span>
              <span className={`flex-1 text-[13px] font-medium ${isTop ? 'text-zinc-900' : 'text-zinc-500'}`}>
                {option.optContent}
              </span>
              <span className="text-[12px] text-zinc-400">
                <span className={`font-semibold ${isTop ? 'text-zinc-900' : 'text-zinc-600'}`}>{option.voteCount}표</span>
                {totalVotes > 0 && <span className="ml-1">({percentage}%)</span>}
              </span>
            </div>
            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isTop ? 'bg-[#3B3EFF]' : 'bg-zinc-300'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
      <p className="text-[12px] text-zinc-400 text-right">총 {totalVotes}표 참여</p>
    </div>
  );
}

export default function VoteDetailPage() {
  const { id, voteId } = useParams<{ id: string; voteId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const mode = searchParams.get('mode');

  const [selectedOptSns, setSelectedOptSns] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const { data: vote, isLoading, isError } = useQuery({
    queryKey: ['vote', voteId],
    queryFn: async () => {
      const { data } = await api.get(`/api/votes/${voteId}`);
      return data.data as VoteResponse;
    },
    enabled: !!voteId,
  });

  const voteMutation = useMutation({
    mutationFn: (optSnList: number[]) =>
      api.post('/api/votes/do', { voteId: Number(voteId), optSnList }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes', id] });
      queryClient.invalidateQueries({ queryKey: ['vote', voteId] });
      setSubmitted(true);
    },
  });

  const toggle = (optSn: number) => {
    if (vote?.voteMulti === 'Y') {
      setSelectedOptSns((prev) =>
        prev.includes(optSn) ? prev.filter((x) => x !== optSn) : [...prev, optSn]
      );
    } else {
      setSelectedOptSns((prev) => (prev.includes(optSn) ? [] : [optSn]));
    }
  };

  if (isLoading) {
    return (
      <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 flex items-center justify-center">
        <p className="text-[14px] text-zinc-400">불러오는 중...</p>
      </div>
    );
  }

  if (isError || !vote) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-[14px] text-zinc-400">투표를 찾을 수 없습니다.</p>
        <button onClick={() => router.back()} className="text-[13px] text-[#3B3EFF]">돌아가기</button>
      </div>
    );
  }

  /* 결과 보기 */
  if (mode === 'results') {
    return (
      <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 py-8 flex flex-col justify-center">
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-6">
          <h1 className="text-[20px] font-bold text-zinc-900">{vote.voteTitle}</h1>
          {vote.voteContent && (
            <p className="text-[14px] text-zinc-500 leading-relaxed -mt-2">{vote.voteContent}</p>
          )}
          <VoteResultsView vote={vote} />
          <button
            onClick={() => router.back()}
            className="w-full py-3.5 rounded-xl text-[15px] font-semibold bg-zinc-100 text-zinc-600"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  /* 투표하기 */
  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 flex flex-col justify-center py-8">
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-6">
        <h1 className="text-[20px] font-bold text-zinc-900">{vote.voteTitle}</h1>
        {vote.voteContent && (
          <p className="text-[14px] text-zinc-500 leading-relaxed -mt-2">{vote.voteContent}</p>
        )}

        {vote.voteMulti === 'Y' && !submitted && (
          <p className="text-[12px] text-zinc-400 -mt-3">여러 항목을 선택할 수 있습니다.</p>
        )}

        <div className="flex flex-col gap-4">
          {vote.options.map((option) => {
            const isSelected = selectedOptSns.includes(option.optSn);
            return (
              <button
                key={option.optSn}
                onClick={() => !submitted && toggle(option.optSn)}
                className="flex items-center gap-3"
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  {submitted ? (
                    isSelected ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B3EFF" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg width="14" height="4" viewBox="0 0 14 4" fill="none">
                        <line x1="0" y1="2" x2="14" y2="2" stroke="#a1a1aa" strokeWidth={2.5} strokeLinecap="round" />
                      </svg>
                    )
                  ) : (
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-[#3B3EFF] border-[#3B3EFF]' : 'border-zinc-300 bg-white'}`}>
                      {isSelected && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                <span className={`text-[14px] font-medium transition-colors ${submitted ? (isSelected ? 'text-[#3B3EFF]' : 'text-zinc-400') : 'text-zinc-900'}`}>
                  {option.optContent}
                </span>
              </button>
            );
          })}
        </div>

        {voteMutation.isError && (
          <p className="text-[12px] text-red-500">투표 제출에 실패했습니다. 다시 시도해주세요.</p>
        )}

        <div className="flex gap-3 mt-2">
          {submitted ? (
            <>
              <button
                onClick={() => { setSubmitted(false); setSelectedOptSns([]); }}
                className="flex-1 border-2 border-[#3B3EFF] bg-white text-[#3B3EFF] text-[14px] font-semibold py-3.5 rounded-xl"
              >
                다시 투표하기
              </button>
              <button
                onClick={() => router.back()}
                className="flex-1 bg-[#3B3EFF] text-white text-[14px] font-semibold py-3.5 rounded-xl"
              >
                완료
              </button>
            </>
          ) : (
            <button
              disabled={selectedOptSns.length === 0 || voteMutation.isPending}
              onClick={() => voteMutation.mutate(selectedOptSns)}
              className={`flex-1 text-[14px] font-semibold py-3.5 rounded-xl transition-colors ${selectedOptSns.length === 0 || voteMutation.isPending ? 'bg-zinc-200 text-zinc-400' : 'bg-[#3B3EFF] text-white'}`}
            >
              {voteMutation.isPending ? '제출 중...' : '투표하기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
