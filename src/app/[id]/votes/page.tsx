'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { VOTES } from './_data';

type TabType = '전체' | '진행중' | '종료';
type SortType = '마감순' | '등록순';

function sortVotes(votes: typeof VOTES, sort: SortType): typeof VOTES {
  if (sort === '마감순') {
    const active = votes
      .filter((v) => v.daysLeft !== null || v.status === '재투표 중')
      .sort((a, b) => (a.daysLeft ?? a.retryDaysLeft ?? 999) - (b.daysLeft ?? b.retryDaysLeft ?? 999));
    const ended = votes.filter((v) => v.daysLeft === null && v.status !== '재투표 중');
    return [...active, ...ended];
  }
  return [...votes].sort((a, b) => Number(a.id) - Number(b.id));
}

const isLeader = true; // TODO: 실제 권한은 auth에서

export default function VotesPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<TabType>('전체');
  const [sort, setSort] = useState<SortType>('마감순');
  const [participation, setParticipation] = useState<'참여' | '미참여' | null>(null);

  const filtered = VOTES.filter((v) => {
    if (tab === '진행중') {
      if (v.daysLeft === null && v.status !== '재투표 중') return false;
      if (participation === '참여') return v.hasVoted;
      if (participation === '미참여') return !v.hasVoted;
      return true;
    }
    if (tab === '종료') return v.daysLeft === null && v.status !== '재투표 중';
    return true;
  });

  const sorted = sortVotes(filtered, sort);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex border-b border-zinc-200 -mx-4 sticky top-0 z-10 bg-white">
        {(['전체', '진행중', '종료'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex justify-center text-[13px] font-medium transition-colors whitespace-nowrap ${tab === t ? 'text-zinc-900' : 'text-zinc-400'
              }`}
          >
            <span className={`inline-block py-2.5 -mb-px ${tab === t ? 'border-b-2 border-zinc-900' : ''}`}>
              {t}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 -mx-4 -mb-5 bg-zinc-100 px-4 pt-4 pb-28 relative">
        {/* 정렬 / 필터 */}
        <div className="flex items-center justify-center mb-3">
          {tab === '진행중' ? (
            <>
              <button
                onClick={() => setParticipation(participation === '참여' ? null : '참여')}
                className={`text-[13px] px-2 ${participation === '참여' ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}
              >
                참여
              </button>
              <span className="text-zinc-300 text-[13px]">|</span>
              <button
                onClick={() => setParticipation(participation === '미참여' ? null : '미참여')}
                className={`text-[13px] px-2 ${participation === '미참여' ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}
              >
                미참여
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setSort('마감순')}
                className={`text-[13px] px-2 ${sort === '마감순' ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}
              >
                마감순
              </button>
              <span className="text-zinc-300 text-[13px]">|</span>
              <button
                onClick={() => setSort('등록순')}
                className={`text-[13px] px-2 ${sort === '등록순' ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}
              >
                등록순
              </button>
            </>
          )}
        </div>

        {/* 투표 목록 */}
        <div className="space-y-3">
          {sorted.length === 0 && (
            <p className="text-center text-[13px] text-zinc-400 py-10">투표가 없습니다.</p>
          )}
          {sorted.map((vote) => {
            const isEnded = vote.daysLeft === null;
            return (
              <div key={vote.id} className="bg-white rounded-lg px-4 py-3">
                <div className="flex items-stretch justify-between gap-3">
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <p className="text-[15px] font-bold text-zinc-900">{vote.title}</p>
                    <p className="text-[12px] text-zinc-400 mb-1">총 {vote.totalVotes}표</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {/* 상태 배지 */}
                    {isEnded ? (
                      vote.status === '팀장확정대기' ? (
                        <span className="text-[15px] font-bold text-amber-500">확정 대기</span>
                      ) : vote.status === '재투표 중' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[15px] font-bold text-amber-500">재투표 중</span>
                          {vote.retryDaysLeft != null && (
                            <span className="text-[15px] font-bold text-[#3B3EFF]">D-{vote.retryDaysLeft}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[15px] font-bold text-[#3B3EFF]">투표 종료</span>
                      )
                    ) : (
                      <span className="text-[15px] font-bold text-[#3B3EFF]">D-{vote.daysLeft}</span>
                    )}
                    {/* 액션 버튼 */}
                    {(() => {
                      const btnBlue = 'text-[12px] font-semibold text-white bg-[#3B3EFF] rounded-lg px-3.5 py-1.5 flex items-center gap-1';
                      const btnGray = 'text-[12px] font-medium text-zinc-400 bg-zinc-100 rounded-lg px-3.5 py-1.5 flex items-center gap-1';
                      const IconCheck = () => (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      );
                      const IconArrow = () => (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      );
                      const IconSearch = () => (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                        </svg>
                      );

                      if (vote.status === '재투표 중') {
                        return vote.hasVoted ? (
                          <Link href={`/${id}/votes/${vote.id}?submitted=true`}>
                            <button className={btnGray}><IconCheck />투표 완료</button>
                          </Link>
                        ) : (
                          <Link href={`/${id}/votes/${vote.id}`}>
                            <button className={btnBlue}><IconArrow />투표하기</button>
                          </Link>
                        );
                      }
                      if (isEnded) {
                        if (vote.status === '팀장확정대기' && isLeader) {
                          return (
                            <Link href={`/${id}/votes/${vote.id}?mode=results&role=leader`}>
                              <button className={btnBlue}><IconCheck />확정하기</button>
                            </Link>
                          );
                        }
                        return (
                          <Link href={`/${id}/votes/${vote.id}?mode=results`}>
                            <button className={btnBlue}><IconSearch />결과 확인</button>
                          </Link>
                        );
                      }
                      return vote.hasVoted ? (
                        <Link href={`/${id}/votes/${vote.id}?submitted=true`}>
                          <button className={btnGray}><IconCheck />투표 완료</button>
                        </Link>
                      ) : (
                        <Link href={`/${id}/votes/${vote.id}`}>
                          <button className={btnBlue}><IconArrow />투표하기</button>
                        </Link>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 모임장 FAB */}
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
    </div>
  );
}
