'use client';

import { Suspense, useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface Voter {
  memNic: string;
  memImgKey: string | null;
}

interface VoteOption {
  optSn: number;
  optContent: string;
  voteCount: number;
  voters: Voter[];
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
  confirmedOptSn: number | null;
}

interface MemberResponse {
  memRole: string;
  memState: string;
}

const INPUT_CLS = 'w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-[14px] text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-[#3B3EFF] transition-colors bg-white';

function VoterList({ voters }: { voters: Voter[] }) {
  if (voters.length === 0) return <p className="text-[12px] text-zinc-400">투표한 멤버가 없습니다.</p>;
  return (
    <div className="flex gap-3 flex-wrap pt-1 pl-1">
      {voters.map((voter, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-[13px] font-semibold text-zinc-600 overflow-hidden shrink-0">
            {voter.memImgKey
              ? <img src={voter.memImgKey} alt={voter.memNic} className="w-full h-full object-cover" />
              : voter.memNic?.[0] ?? '?'}
          </div>
          <span className="text-[11px] text-zinc-500">{voter.memNic}</span>
        </div>
      ))}
    </div>
  );
}

function OptionBar({
  option, idx, isTop, totalVotes, expanded, onToggle,
  confirmSlot,
}: {
  option: VoteOption; idx: number; isTop: boolean;
  totalVotes: number; expanded: boolean; onToggle: () => void;
  confirmSlot?: React.ReactNode;
}) {
  const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className={`w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center shrink-0 ${isTop ? 'bg-[#3B3EFF] text-white' : 'bg-zinc-200 text-zinc-500'}`}>
          {idx + 1}
        </span>
        <span className={`flex-1 text-[13px] font-medium ${isTop ? 'text-zinc-900' : 'text-zinc-500'}`}>
          {option.optContent}
        </span>
        {confirmSlot}
        <span className="text-[12px] text-zinc-400">
          <span className={`font-semibold ${isTop ? 'text-zinc-900' : 'text-zinc-600'}`}>{option.voteCount}표</span>
          {totalVotes > 0 && <span className="ml-1">({percentage}%)</span>}
        </span>
        <button
          onClick={onToggle}
          className="w-5 h-5 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-400 text-[13px] leading-none shrink-0"
        >
          {expanded ? '−' : '+'}
        </button>
      </div>
      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${isTop ? 'bg-[#3B3EFF]' : 'bg-zinc-300'}`} style={{ width: `${percentage}%` }} />
      </div>
      {expanded && <VoterList voters={option.voters} />}
    </div>
  );
}

function VoteResultsView({
  vote, isLeader, onBack,
}: {
  vote: VoteResponse; isLeader: boolean; onBack: () => void;
}) {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<number[]>([]);
  const [confirmedOptSn, setConfirmedOptSn] = useState<number | null>(vote.confirmedOptSn ?? null);
  const [isFinalized, setIsFinalized] = useState<boolean>(vote.confirmedOptSn !== null);

  // 재투표 상태
  const [revoteSelected, setRevoteSelected] = useState<number[]>([]);
  const [revoteEndDt, setRevoteEndDt] = useState('');
  const [showRevoteForm, setShowRevoteForm] = useState(false);

  const totalVotes = vote.options.reduce((sum, o) => sum + o.voteCount, 0);
  const maxCount = Math.max(...vote.options.map((o) => o.voteCount), 0);
  const tiedOptions = vote.options.filter((o) => o.voteCount === maxCount && maxCount > 0);
  const isTied = tiedOptions.length > 1;

  const toggleExpand = (optSn: number) =>
    setExpanded((prev) => prev.includes(optSn) ? prev.filter((x) => x !== optSn) : [...prev, optSn]);

  const confirmMutation = useMutation({
    mutationFn: (optSn: number) =>
      api.patch(`/api/votes/${vote.voteId}/confirm?optSn=${optSn}`),
    onSuccess: (_, optSn) => {
      setConfirmedOptSn(optSn);
      queryClient.invalidateQueries({ queryKey: ['vote', String(vote.voteId)] });
      queryClient.invalidateQueries({ queryKey: ['votes', id] });
    },
  });

  const revoteMutation = useMutation({
    mutationFn: (options: string[]) => {
      const today = new Date().toISOString().split('T')[0];
      return api.post('/api/votes', {
        voteTitle: `${vote.voteTitle} (재투표)`,
        voteContent: vote.voteContent,
        voteStartDt: today,
        voteEndDt: revoteEndDt,
        voteType: vote.voteType,
        voteRule: vote.voteRule,
        voteMulti: vote.voteMulti,
        teamId: vote.teamId,
        options,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes', id] });
      onBack();
    },
  });

  const today = new Date().toISOString().split('T')[0];

  // 동률 없음
  if (!isTied) {
    return (
      <div className="flex flex-col gap-5">
        {vote.options.map((option, idx) => (
          <OptionBar
            key={option.optSn}
            option={option} idx={idx}
            isTop={option.voteCount === maxCount && maxCount > 0}

            totalVotes={totalVotes}
            expanded={expanded.includes(option.optSn)}
            onToggle={() => toggleExpand(option.optSn)}
          />
        ))}
        <p className="text-[12px] text-zinc-400 text-right">총 {totalVotes}표 참여</p>
        <button onClick={onBack} className="w-full py-3.5 rounded-xl text-[15px] font-semibold bg-zinc-100 text-zinc-600">
          닫기
        </button>
      </div>
    );
  }

  // 동률 — 팀장 임의 결정 (voteRule = 'L')
  if (vote.voteRule === 'L') {
    const CheckBadge = () => (
      <span className="shrink-0 text-[11px] font-semibold text-white bg-[#3B3EFF] rounded-lg px-2 py-0.5 flex items-center gap-0.5">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
        확정
      </span>
    );

    // 완료 후 확정 결과 화면
    if (isFinalized && confirmedOptSn !== null) {
      return (
        <div className="flex flex-col gap-5">
          {vote.options.map((option, idx) => (
            <OptionBar
              key={option.optSn}
              option={option} idx={idx}
              isTop={option.optSn === confirmedOptSn}
              totalVotes={totalVotes}
              expanded={expanded.includes(option.optSn)}
              onToggle={() => toggleExpand(option.optSn)}
              confirmSlot={option.optSn === confirmedOptSn ? <CheckBadge /> : undefined}
            />
          ))}
          <p className="text-[12px] text-zinc-400 text-right">총 {totalVotes}표 참여</p>
          <div className="flex gap-3">
            {isLeader && (
              <button
                onClick={() => setIsFinalized(false)}
                className="flex-1 py-3.5 rounded-xl text-[14px] font-semibold text-zinc-500 border border-zinc-200"
              >
                확정 변경
              </button>
            )}
            <button onClick={onBack} className="flex-1 py-3.5 rounded-xl text-[15px] font-semibold bg-zinc-100 text-zinc-600">
              닫기
            </button>
          </div>
        </div>
      );
    }

    // 선택 화면
    return (
      <div className="flex flex-col gap-5">
        {isLeader && (
          <p className="text-[13px] text-[#3B3EFF] font-medium text-center bg-[#EBEBFF] rounded-xl py-2.5">
            동률이 발생했습니다. 최종 항목을 선택해주세요.
          </p>
        )}
        {vote.options.map((option, idx) => {
          const isTop = option.voteCount === maxCount && maxCount > 0;
          const isTiedOption = tiedOptions.some((o) => o.optSn === option.optSn);
          const isThisConfirmed = confirmedOptSn === option.optSn;

          let confirmSlot: React.ReactNode = null;
          if (isTiedOption) {
            if (isThisConfirmed) {
              confirmSlot = <CheckBadge />;
            } else if (isLeader) {
              confirmSlot = (
                <button
                  onClick={() => confirmMutation.mutate(option.optSn)}
                  disabled={confirmMutation.isPending}
                  className="shrink-0 text-[11px] font-semibold text-zinc-500 border border-zinc-300 rounded-lg px-2 py-0.5"
                >
                  최종 선택
                </button>
              );
            }
          }

          return (
            <OptionBar
              key={option.optSn}
              option={option} idx={idx}
              isTop={isTop}
              totalVotes={totalVotes}
              expanded={expanded.includes(option.optSn)}
              onToggle={() => toggleExpand(option.optSn)}
              confirmSlot={confirmSlot}
            />
          );
        })}
        <p className="text-[12px] text-zinc-400 text-right">총 {totalVotes}표 참여</p>
        <div className="flex gap-3">
          {isLeader && (
            <button
              disabled={confirmedOptSn === null}
              onClick={() => setIsFinalized(true)}
              className={`flex-1 py-3.5 rounded-xl text-[15px] font-semibold transition-colors ${confirmedOptSn !== null ? 'bg-[#3B3EFF] text-white' : 'bg-zinc-200 text-zinc-400'}`}
            >
              완료
            </button>
          )}
          <button onClick={onBack} className="flex-1 py-3.5 rounded-xl text-[15px] font-semibold bg-zinc-100 text-zinc-600">
            닫기
          </button>
        </div>
      </div>
    );
  }

  // 동률 — 재투표 (voteRule = 'R')
  return (
    <div className="flex flex-col gap-5">
      {isLeader && !showRevoteForm && (
        <p className="text-[13px] text-[#3B3EFF] font-medium text-center bg-[#EBEBFF] rounded-xl py-2.5">
          동률이 발생했습니다. 재투표를 진행할 수 있습니다.
        </p>
      )}
      {vote.options.map((option, idx) => {
        const isTop = option.voteCount === maxCount && maxCount > 0;
        const isTiedOption = tiedOptions.some((o) => o.optSn === option.optSn);

        let confirmSlot: React.ReactNode = null;
        if (isLeader && showRevoteForm && isTiedOption) {
          const checked = revoteSelected.includes(option.optSn);
          confirmSlot = (
            <button
              onClick={() => setRevoteSelected((prev) =>
                checked ? prev.filter((x) => x !== option.optSn) : [...prev, option.optSn]
              )}
              className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${checked ? 'bg-[#3B3EFF] border-[#3B3EFF]' : 'border-zinc-300 bg-white'}`}
            >
              {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
            </button>
          );
        }

        return (
          <OptionBar
            key={option.optSn}
            option={option} idx={idx}
            isTop={isTop}
            totalVotes={totalVotes}
            expanded={expanded.includes(option.optSn)}
            onToggle={() => toggleExpand(option.optSn)}
            confirmSlot={confirmSlot}
          />
        );
      })}
      <p className="text-[12px] text-zinc-400 text-right">총 {totalVotes}표 참여</p>

      {isLeader && showRevoteForm && (
        <div className="flex flex-col gap-3 border border-zinc-200 rounded-xl p-4">
          <p className="text-[13px] font-semibold text-zinc-700">재투표 마감일</p>
          <input
            type="date" value={revoteEndDt} min={today}
            onChange={(e) => setRevoteEndDt(e.target.value)}
            className={INPUT_CLS}
          />
          {revoteMutation.isError && <p className="text-[12px] text-red-500">재투표 생성에 실패했습니다.</p>}
          <div className="flex gap-3">
            <button
              onClick={() => { setShowRevoteForm(false); setRevoteSelected([]); }}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-zinc-600 bg-zinc-100"
            >
              취소
            </button>
            <button
              disabled={revoteSelected.length < 2 || !revoteEndDt || revoteMutation.isPending}
              onClick={() => {
                const contents = revoteSelected.map(
                  (sn) => vote.options.find((o) => o.optSn === sn)!.optContent
                );
                revoteMutation.mutate(contents);
              }}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${revoteSelected.length < 2 || !revoteEndDt || revoteMutation.isPending ? 'bg-zinc-200 text-zinc-400' : 'bg-[#3B3EFF] text-white'}`}
            >
              {revoteMutation.isPending ? '생성 중...' : '재투표 시작'}
            </button>
          </div>
        </div>
      )}

      {isLeader && !showRevoteForm ? (
        <div className="flex gap-3">
          <button
            onClick={() => setShowRevoteForm(true)}
            className="flex-1 py-3.5 rounded-xl text-[14px] font-semibold text-[#3B3EFF] border border-[#3B3EFF] bg-white"
          >
            재투표 진행
          </button>
          <button onClick={onBack} className="flex-1 py-3.5 rounded-xl text-[15px] font-semibold bg-zinc-100 text-zinc-600">
            닫기
          </button>
        </div>
      ) : (
        <button onClick={onBack} className="w-full py-3.5 rounded-xl text-[15px] font-semibold bg-zinc-100 text-zinc-600">
          닫기
        </button>
      )}
    </div>
  );
}

function VoteDetailContent() {
  const { id, voteId } = useParams<{ id: string; voteId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const mode = searchParams.get('mode');

  const [selectedOptSns, setSelectedOptSns] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editEndDt, setEditEndDt] = useState('');

  const { data: myMembership } = useQuery({
    queryKey: ['members', 'me', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/me?teamId=${id}`);
      return data.data as MemberResponse;
    },
    enabled: !!id,
  });

  const isLeader = myMembership?.memRole === 'L' && myMembership?.memState === 'A';

  const { data: vote, isLoading, isError } = useQuery({
    queryKey: ['vote', voteId],
    queryFn: async () => {
      const { data } = await api.get(`/api/votes/${voteId}`);
      return data.data as VoteResponse;
    },
    enabled: !!voteId,
  });

  useEffect(() => {
    if (vote?.myVoted && vote.myOptSns?.length > 0) {
      setSelectedOptSns(vote.myOptSns);
    }
  }, [vote?.myVoted, vote?.myOptSns]);

  const voteMutation = useMutation({
    mutationFn: (optSnList: number[]) =>
      api.post('/api/votes/do', { voteId: Number(voteId), optSnList }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes', id] });
      queryClient.invalidateQueries({ queryKey: ['vote', voteId] });
      setSubmitted(true);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (body: { voteTitle: string; voteContent: string; voteEndDt: string }) =>
      api.put(`/api/votes/${voteId}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes', id] });
      queryClient.invalidateQueries({ queryKey: ['vote', voteId] });
      setIsEditMode(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/votes/${voteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes', id] });
      router.back();
    },
  });

  const openEditMode = () => {
    if (!vote) return;
    setEditTitle(vote.voteTitle);
    setEditContent(vote.voteContent);
    setEditEndDt(vote.voteEndDt);
    setIsEditMode(true);
  };

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

  const DeleteConfirmModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-[300px] p-6 shadow-xl">
        <h3 className="text-[16px] font-bold text-zinc-900 text-center mb-2">투표 삭제</h3>
        <p className="text-[13px] text-zinc-500 text-center mb-6">
          투표를 삭제하면 복구할 수 없습니다.<br />정말 삭제하시겠습니까?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="flex-1 py-2.5 rounded-xl text-[14px] font-medium text-zinc-600 border border-zinc-200"
          >
            취소
          </button>
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-red-500 disabled:opacity-60"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );

  /* 결과 보기 (종료된 투표) */
  if (mode === 'results') {
    return (
      <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 py-8 flex flex-col justify-center">
        {showDeleteConfirm && <DeleteConfirmModal />}
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h1 className="text-[20px] font-bold text-zinc-900 mb-1">{vote.voteTitle}</h1>
              {vote.voteContent && (
                <p className="text-[14px] text-zinc-500 leading-relaxed">{vote.voteContent}</p>
              )}
            </div>
            {isLeader && (
              <button onClick={() => setShowDeleteConfirm(true)} className="text-zinc-400 hover:text-red-400 transition-colors shrink-0 mt-0.5">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
          <VoteResultsView
            vote={vote}
            isLeader={isLeader}
            onBack={() => router.back()}
          />
        </div>
      </div>
    );
  }

  /* 투표 내용 수정 모드 (모임장만) */
  if (isEditMode) {
    const today = new Date().toISOString().split('T')[0];
    return (
      <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 py-8 flex flex-col justify-center">
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="text-[18px] font-bold text-zinc-900">투표 수정</h2>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-zinc-500">제목</label>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={INPUT_CLS} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-zinc-500">내용</label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className={`${INPUT_CLS} resize-none`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-zinc-500">마감일</label>
            <input
              type="date" value={editEndDt}
              onChange={(e) => setEditEndDt(e.target.value)}
              min={today} className={INPUT_CLS}
            />
          </div>
          {updateMutation.isError && <p className="text-[12px] text-red-500">수정에 실패했습니다.</p>}
          <div className="flex gap-3">
            <button onClick={() => setIsEditMode(false)} className="flex-1 py-3.5 rounded-xl text-[14px] font-semibold bg-zinc-100 text-zinc-600">취소</button>
            <button
              disabled={!editTitle.trim() || !editContent.trim() || !editEndDt || updateMutation.isPending}
              onClick={() => updateMutation.mutate({ voteTitle: editTitle.trim(), voteContent: editContent.trim(), voteEndDt: editEndDt })}
              className={`flex-1 py-3.5 rounded-xl text-[14px] font-semibold transition-colors ${!editTitle.trim() || !editContent.trim() || !editEndDt || updateMutation.isPending ? 'bg-zinc-200 text-zinc-400' : 'bg-[#3B3EFF] text-white'}`}
            >
              {updateMutation.isPending ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* 투표하기 / 다시 투표 */
  const isRevoteMode = vote.myVoted && !submitted;

  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 flex flex-col justify-center py-8">
      {showDeleteConfirm && <DeleteConfirmModal />}
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-[20px] font-bold text-zinc-900 flex-1">{vote.voteTitle}</h1>
              {isRevoteMode && (
                <span className="shrink-0 text-[11px] font-semibold text-[#3B3EFF] bg-[#EBEBFF] px-2 py-0.5 rounded-full">참여 완료</span>
              )}
            </div>
            {vote.voteContent && (
              <p className="text-[14px] text-zinc-500 leading-relaxed">{vote.voteContent}</p>
            )}
          </div>
          {isLeader && (
            <div className="flex gap-2 shrink-0">
              <button onClick={openEditMode} className="text-zinc-400 hover:text-[#3B3EFF] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button onClick={() => setShowDeleteConfirm(true)} className="text-zinc-400 hover:text-red-400 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {isRevoteMode && <p className="text-[12px] text-zinc-400 -mt-3">선택을 변경하여 다시 제출할 수 있습니다.</p>}
        {vote.voteMulti === 'Y' && !submitted && <p className="text-[12px] text-zinc-400 -mt-3">여러 항목을 선택할 수 있습니다.</p>}

        <div className="flex flex-col gap-4">
          {vote.options.map((option) => {
            const isSelected = selectedOptSns.includes(option.optSn);
            const isPrevSelection = vote.myVoted && vote.myOptSns.includes(option.optSn);
            return (
              <button key={option.optSn} onClick={() => !submitted && toggle(option.optSn)} className="flex items-center gap-3 text-left">
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  {submitted ? (
                    isSelected
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B3EFF" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      : <svg width="14" height="4" viewBox="0 0 14 4" fill="none"><line x1="0" y1="2" x2="14" y2="2" stroke="#a1a1aa" strokeWidth={2.5} strokeLinecap="round"/></svg>
                  ) : (
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-[#3B3EFF] border-[#3B3EFF]' : 'border-zinc-300 bg-white'}`}>
                      {isSelected && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                    </div>
                  )}
                </div>
                <span className={`flex-1 text-[14px] font-medium transition-colors ${submitted ? (isSelected ? 'text-[#3B3EFF]' : 'text-zinc-400') : 'text-zinc-900'}`}>
                  {option.optContent}
                </span>
                {isRevoteMode && isPrevSelection && !isSelected && (
                  <span className="text-[10px] text-zinc-400 shrink-0">이전 선택</span>
                )}
              </button>
            );
          })}
        </div>

        {voteMutation.isError && <p className="text-[12px] text-red-500">제출에 실패했습니다. 다시 시도해주세요.</p>}

        <div className="flex gap-3 mt-2">
          {submitted ? (
            <>
              <button
                onClick={() => { setSubmitted(false); setSelectedOptSns(vote.myOptSns ?? []); }}
                className="flex-1 border-2 border-[#3B3EFF] bg-white text-[#3B3EFF] text-[14px] font-semibold py-3.5 rounded-xl"
              >
                다시 투표하기
              </button>
              <button onClick={() => router.back()} className="flex-1 bg-[#3B3EFF] text-white text-[14px] font-semibold py-3.5 rounded-xl">
                완료
              </button>
            </>
          ) : (
            <button
              disabled={selectedOptSns.length === 0 || voteMutation.isPending}
              onClick={() => voteMutation.mutate(selectedOptSns)}
              className={`flex-1 text-[14px] font-semibold py-3.5 rounded-xl transition-colors ${selectedOptSns.length === 0 || voteMutation.isPending ? 'bg-zinc-200 text-zinc-400' : 'bg-[#3B3EFF] text-white'}`}
            >
              {voteMutation.isPending ? '제출 중...' : isRevoteMode ? '다시 투표' : '투표하기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VoteDetailPage() {
  return (
    <Suspense fallback={
      <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 flex items-center justify-center">
        <p className="text-[14px] text-zinc-400">불러오는 중...</p>
      </div>
    }>
      <VoteDetailContent />
    </Suspense>
  );
}