'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

type TabType = '전체' | '진행중' | '종료';
type SortType = '마감순' | '등록순';

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
  myVoted: boolean;
  myOptSns: number[];
}

interface MemberResponse {
  memRole: string;
  memState: string;
}

function getDaysLeft(endDt: string): number | null {
  const diff = Math.ceil((new Date(endDt).getTime() - Date.now()) / 86400000);
  return diff > 0 ? diff : null;
}

function DeleteVotePopup({ title, onConfirm, onCancel, isPending }: {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-[280px] overflow-hidden">
        <div className="px-6 pt-6 pb-5 text-center">
          <div className="w-11 h-11 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </div>
          <p className="text-[15px] font-bold text-zinc-900 mb-1">투표를 삭제할까요?</p>
          <p className="text-[12px] text-zinc-400 leading-relaxed">
            <span className="font-medium text-zinc-600">&ldquo;{title}&rdquo;</span><br />삭제 후 복구할 수 없어요.
          </p>
        </div>
        <div className="flex border-t border-zinc-100">
          <button onClick={onCancel} className="flex-1 py-3.5 text-[14px] font-medium text-zinc-500 border-r border-zinc-100">취소</button>
          <button onClick={onConfirm} disabled={isPending} className="flex-1 py-3.5 text-[14px] font-semibold text-red-500 disabled:opacity-50">
            {isPending ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </>
  );
}

export default function VotesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabType>('전체');
  const [sort, setSort] = useState<SortType>('마감순');
  const [deleteTarget, setDeleteTarget] = useState<VoteResponse | null>(null);

  const { data: myMembership } = useQuery({
    queryKey: ['members', 'me', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/me?teamId=${id}`);
      return data.data as MemberResponse;
    },
    enabled: !!id,
  });

  const isLeader = myMembership?.memRole === 'L' && myMembership?.memState === 'A';

  const { data: votes = [], isLoading } = useQuery({
    queryKey: ['votes', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/votes?teamId=${id}`);
      return data.data as VoteResponse[];
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: (voteId: number) => api.delete(`/api/votes/${voteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes', id] });
      setDeleteTarget(null);
    },
    onError: () => alert('삭제에 실패했습니다.'),
  });

  const filtered = votes.filter((v) => {
    const daysLeft = getDaysLeft(v.voteEndDt);
    if (tab === '진행중') return daysLeft !== null;
    if (tab === '종료') return daysLeft === null;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === '마감순') {
      return (getDaysLeft(a.voteEndDt) ?? 9999) - (getDaysLeft(b.voteEndDt) ?? 9999);
    }
    return a.voteId - b.voteId;
  });

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex border-b border-zinc-200 -mx-4 sticky top-0 z-10 bg-white">
        {(['전체', '진행중', '종료'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex justify-center text-[13px] font-medium transition-colors whitespace-nowrap ${tab === t ? 'text-zinc-900' : 'text-zinc-400'}`}
          >
            <span className={`inline-block py-2.5 -mb-px ${tab === t ? 'border-b-2 border-zinc-900' : ''}`}>{t}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 -mx-4 -mb-5 bg-zinc-100 px-4 pt-4 pb-28 relative">
        <div className="flex items-center justify-center mb-3">
          {(['마감순', '등록순'] as SortType[]).map((s, i) => (
            <span key={s} className="flex items-center">
              {i > 0 && <span className="text-zinc-300 text-[13px]">|</span>}
              <button
                onClick={() => setSort(s)}
                className={`text-[13px] px-2 ${sort === s ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}
              >
                {s}
              </button>
            </span>
          ))}
        </div>

        <div className="space-y-3">
          {isLoading && <p className="text-center text-[13px] text-zinc-400 py-10">불러오는 중...</p>}
          {!isLoading && sorted.length === 0 && (
            <p className="text-center text-[13px] text-zinc-400 py-10">투표가 없습니다.</p>
          )}
          {sorted.map((vote) => {
            const daysLeft = getDaysLeft(vote.voteEndDt);
            const isEnded = daysLeft === null;
            const totalVotes = vote.options.reduce((sum, o) => sum + o.voteCount, 0);
            const mySelectedOption = vote.myVoted
              ? vote.options.find((o) => vote.myOptSns.includes(o.optSn))
              : null;

            return (
              <div key={vote.voteId} className="bg-white rounded-lg px-4 py-3">
                <div className="flex items-stretch justify-between gap-3">
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[15px] font-bold text-zinc-900 leading-tight">{vote.voteTitle}</p>
                      {vote.myVoted && !isEnded && (
                        <span className="shrink-0 text-[10px] font-semibold text-[#3B3EFF] bg-[#EBEBFF] px-1.5 py-0.5 rounded-full">참여</span>
                      )}
                    </div>
                    {mySelectedOption && !isEnded && (
                      <p className="text-[12px] text-zinc-500">
                        선택: <span className="font-semibold text-zinc-800">{mySelectedOption.optContent}</span>
                      </p>
                    )}
                    <p className="text-[12px] text-zinc-400">총 {totalVotes}표</p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {isEnded ? (
                      <span className="text-[15px] font-bold text-[#3B3EFF]">투표 종료</span>
                    ) : (
                      <span className="text-[15px] font-bold text-[#3B3EFF]">D-{daysLeft}</span>
                    )}

                    {isEnded ? (
                      <Link href={`/${id}/votes/${vote.voteId}?mode=results`}>
                        <button className="text-[12px] font-semibold text-white bg-[#3B3EFF] rounded-lg px-3.5 py-1.5 flex items-center gap-1">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                          </svg>
                          결과 확인
                        </button>
                      </Link>
                    ) : vote.myVoted ? (
                      <Link href={`/${id}/votes/${vote.voteId}`}>
                        <button className="text-[12px] font-semibold text-[#3B3EFF] border border-[#3B3EFF] bg-white rounded-lg px-3.5 py-1.5 flex items-center gap-1">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          수정하기
                        </button>
                      </Link>
                    ) : (
                      <Link href={`/${id}/votes/${vote.voteId}`}>
                        <button className="text-[12px] font-semibold text-white bg-[#3B3EFF] rounded-lg px-3.5 py-1.5 flex items-center gap-1">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                          투표하기
                        </button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* 리더 전용 관리 버튼 */}
                {isLeader && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100">
                    <button
                      onClick={() => router.push(`/${id}/votes/${vote.voteId}/edit`)}
                      className="flex-1 py-1.5 rounded-lg border border-zinc-200 text-[12px] font-medium text-zinc-500 flex items-center justify-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      수정
                    </button>
                    <button
                      onClick={() => setDeleteTarget(vote)}
                      className="flex-1 py-1.5 rounded-lg border border-red-100 text-[12px] font-medium text-red-400 flex items-center justify-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                      </svg>
                      삭제
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isLeader && (
          <Link
            href={`/${id}/votes/create`}
            className="fixed bottom-6 bg-[#3B3EFF] text-white text-[13px] font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-1.5"
            style={{ right: 'max(1rem, calc((100vw - 390px) / 2 + 1rem))' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            투표 생성
          </Link>
        )}
      </div>

      {deleteTarget && (
        <DeleteVotePopup
          title={deleteTarget.voteTitle}
          onConfirm={() => deleteMutation.mutate(deleteTarget.voteId)}
          onCancel={() => setDeleteTarget(null)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
