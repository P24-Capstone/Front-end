'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { VOTES, Vote, Voter } from '../_data';

function ProfileBubble({ voter }: { voter: Voter }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-[13px] font-semibold text-zinc-600">
        {voter.name.slice(0, 1)}
      </div>
      <span className="text-[11px] text-zinc-500">{voter.name}</span>
    </div>
  );
}

function VoteResultsView({ vote, isLeaderView }: { vote: Vote; isLeaderView: boolean }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  if (!vote.results) return null;

  const maxVotes = Math.max(...vote.results.map((r) => r.voters.length));
  const tiedIds = vote.results
    .filter((r) => r.voters.length === maxVotes)
    .map((r) => r.optionId);
  const canConfirm = isLeaderView && vote.status === '팀장확정대기' && tiedIds.length > 1;

  const toggleExpand = (optionId: string) => {
    setExpanded((prev) =>
      prev.includes(optionId) ? prev.filter((x) => x !== optionId) : [...prev, optionId]
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {vote.options.map((option, idx) => {
        const result = vote.results!.find((r) => r.optionId === option.id);
        const count = result?.voters.length ?? 0;
        const isTop = count === maxVotes && count > 0;
        const isTied = tiedIds.length > 1 && isTop;
        const isSelected = selected === option.id;
        const percentage = vote.totalMembers ? (count / vote.totalMembers) * 100 : 0;
        const isExpanded = expanded.includes(option.id);

        return (
          <div key={option.id} className="flex flex-col gap-2">
            {/* 옵션 행 */}
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center shrink-0 ${
                isTop ? 'bg-[#3B3EFF] text-white' : 'bg-zinc-200 text-zinc-500'
              }`}>
                {idx + 1}
              </span>
              <span className={`flex-1 text-[13px] font-medium ${isTop ? 'text-zinc-900' : 'text-zinc-500'}`}>
                {option.label}
              </span>
              {canConfirm && isTied && (
                isSelected ? (
                  <span className="inline-flex items-center justify-center gap-0.5 w-[62px] text-[11px] font-semibold text-[#3B3EFF] border border-transparent rounded-lg py-0.5 shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    선택됨
                  </span>
                ) : (
                  <button
                    onClick={() => setSelected(option.id)}
                    className="inline-flex items-center justify-center w-[62px] text-[11px] font-semibold text-zinc-500 border border-zinc-300 rounded-lg py-0.5 shrink-0"
                  >
                    최종 선택
                  </button>
                )
              )}
              <span className="text-[12px] text-zinc-400">
                <span className={`font-semibold ${isTop ? 'text-zinc-900' : 'text-zinc-600'}`}>{count}명</span>
                /{vote.totalMembers}
              </span>
              <button
                onClick={() => toggleExpand(option.id)}
                className="w-5 h-5 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-400 text-[13px] leading-none"
              >
                {isExpanded ? '−' : '+'}
              </button>
            </div>

            {/* 막대 */}
            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isTop ? 'bg-[#3B3EFF]' : 'bg-zinc-300'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* 투표자 프로필 */}
            {isExpanded && result && result.voters.length > 0 && (
              <div className="flex gap-3 flex-wrap pt-1 pl-1">
                {result.voters.map((voter) => (
                  <ProfileBubble key={voter.id} voter={voter} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* 미참여 */}
      {vote.nonParticipants && vote.nonParticipants.length > 0 && (
        <div className="mt-1">
          <p className="text-[13px] text-zinc-500 mb-2">
            미참여 <span className="font-bold text-zinc-900">{vote.nonParticipants.length}명</span>
          </p>
          <div className="border border-zinc-200 rounded-xl px-4 py-3 flex gap-3 flex-wrap">
            {vote.nonParticipants.map((person) => (
              <ProfileBubble key={person.id} voter={person} />
            ))}
          </div>
        </div>
      )}

      {/* 일정 확정하기 — 모임장 + 팀장확정대기 투표에만 표시 */}
      {canConfirm && (
        <button
          onClick={() => selected && router.back()}
          className={`w-full py-3.5 rounded-xl text-[15px] font-semibold transition-colors ${
            selected
              ? 'bg-[#3B3EFF] text-white'
              : 'border border-zinc-200 bg-white text-zinc-400'
          }`}
        >
          일정 확정하기
        </button>
      )}
    </div>
  );
}

export default function VoteDetailPage() {
  const { voteId } = useParams<{ voteId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(searchParams.get('submitted') === 'true');

  const vote = VOTES.find((v) => v.id === voteId);

  if (!vote) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-[14px] text-zinc-400">투표를 찾을 수 없습니다.</p>
        <button onClick={() => router.back()} className="text-[13px] text-[#3B3EFF]">돌아가기</button>
      </div>
    );
  }

  const toggle = (optionId: string) => {
    setSelected((prev) =>
      prev.includes(optionId) ? prev.filter((x) => x !== optionId) : [...prev, optionId]
    );
  };

  /* ── 결과 보기 ── */
  if (mode === 'results') {
    const isLeaderView = searchParams.get('role') === 'leader';
    return (
      <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 py-8 flex flex-col justify-center">
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-6">
          <h1 className="text-[20px] font-bold text-zinc-900">{vote.title}</h1>
          <p className="text-[14px] text-zinc-500 leading-relaxed -mt-2">{vote.description}</p>
          <VoteResultsView vote={vote} isLeaderView={isLeaderView} />
        </div>
      </div>
    );
  }

  /* ── 투표하기 ── */
  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 flex flex-col justify-center py-8">
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-6">
        <h1 className="text-[20px] font-bold text-zinc-900">{vote.title}</h1>
        <p className="text-[14px] text-zinc-500 leading-relaxed -mt-2">{vote.description}</p>

        <div className="flex flex-col gap-4">
          {vote.options.map((option) => {
            const isSelected = selected.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => !submitted && toggle(option.id)}
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
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-[#3B3EFF] border-[#3B3EFF]' : 'border-zinc-300 bg-white'
                    }`}>
                      {isSelected && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                <span className={`text-[14px] font-medium transition-colors ${
                  submitted
                    ? isSelected ? 'text-[#3B3EFF]' : 'text-zinc-400'
                    : 'text-zinc-900'
                }`}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 mt-2">
          {submitted ? (
            <>
              <button
                onClick={() => setSubmitted(false)}
                className="flex-1 border-2 border-[#3B3EFF] bg-white text-[#3B3EFF] text-[14px] font-semibold py-3.5 rounded-xl"
              >
                다시 투표하기
              </button>
              <button
                onClick={() => router.back()}
                className="flex-1 border-2 border-transparent bg-[#3B3EFF] text-white text-[14px] font-semibold py-3.5 rounded-xl"
              >
                완료
              </button>
            </>
          ) : (
            <button
              onClick={() => setSubmitted(true)}
              className="flex-1 border-2 border-transparent bg-[#3B3EFF] text-white text-[14px] font-semibold py-3.5 rounded-xl"
            >
              투표하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
