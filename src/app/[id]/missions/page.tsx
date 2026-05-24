'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

type ScopeTab = '전체' | '공통' | '개인';
type LeaderTab = '공통' | '개인';
type StatusFilter = '전체' | '진행 중' | '완료';
type UserStatus = 'available' | 'pending' | 'completed' | 'failed';

interface MemberMe { memRole: string; memState: string; }

interface MissionData {
  missionId: number;
  missionTitle: string;
  missionContent: string;
  missionType: string; // 'A'(공통) | 'P'(개인)
  verifyPrompt: string | null;
  missionStartDtm: string;
  missionEndDtm: string;
  teamId: string;
  memIds: string[];
  fileKeys: string[];
}

const SCOPE_COLOR: Record<string, string> = { 공통: '#FF9E6A', 개인: '#E5638C' };

function getScope(missionType: string): '공통' | '개인' {
  return missionType === 'P' ? '개인' : '공통';
}

function getDeadlineText(endDtm: string): string | null {
  const end = new Date(endDtm.replace(' ', 'T'));
  const diff = end.getTime() - Date.now();
  if (diff <= 0) return null;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}분`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간`;
  return `${Math.floor(hours / 24)}일`;
}

function deadlineColor(dl: string): string {
  if (dl.includes('분') || dl.includes('시간')) return 'text-[#f97316]';
  return Number(dl.replace(/\D/g, '')) <= 3 ? 'text-[#f97316]' : 'text-[#3B3EFF]';
}

function Badges({ scope }: { scope: '공통' | '개인' }) {
  return (
    <div className="flex gap-1 mb-1">
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
        style={{ backgroundColor: SCOPE_COLOR[scope] }}>{scope}</span>
    </div>
  );
}

function DeleteMissionPopup({ title, onConfirm, onCancel, isPending }: {
  title: string; onConfirm: () => void; onCancel: () => void; isPending: boolean;
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
          <p className="text-[15px] font-bold text-zinc-900 mb-1">미션을 삭제할까요?</p>
          <p className="text-[12px] text-zinc-400 leading-relaxed">
            <span className="font-medium text-zinc-600">"{title}"</span><br />
            모든 인증 내역도 함께 삭제됩니다.
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

function MemberMissionCard({ m, deadline, userStatus, onVerify, onViewPending }: {
  m: MissionData; deadline: string | null; userStatus: UserStatus;
  onVerify: () => void; onViewPending: () => void;
}) {
  const scope = getScope(m.missionType);
  const isDone = userStatus === 'completed';
  return (
    <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full shrink-0 ${isDone ? 'bg-zinc-300' : 'bg-zinc-200'}`} />
      <div className="flex-1 min-w-0">
        <Badges scope={scope} />
        <p className="text-[12px] font-medium text-zinc-800 leading-tight">{m.missionTitle}</p>
        <p className="text-[11px] text-zinc-400 mt-1 truncate">{m.missionContent}</p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-2">
        {userStatus === 'available' && (
          <>
            {deadline
              ? <p className="text-[12px]"><span className="text-zinc-800">마감까지 </span><span className={deadlineColor(deadline)}>{deadline}</span></p>
              : <span className="text-[12px] text-zinc-400">마감</span>}
            {deadline && (
              <button onClick={onVerify} className="text-[12px] font-semibold text-white bg-[#3B3EFF] rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                인증하기
              </button>
            )}
          </>
        )}
        {userStatus === 'pending' && (
          <>
            {deadline
              ? <p className="text-[12px]"><span className="text-zinc-800">마감까지 </span><span className={deadlineColor(deadline)}>{deadline}</span></p>
              : <span className="text-[12px] text-zinc-400">마감</span>}
            <button onClick={onViewPending} className="text-[12px] font-semibold text-white bg-[#3B3EFF] rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              승인 대기
            </button>
          </>
        )}
        {userStatus === 'failed' && (
          <>
            <span className="text-[12px] text-zinc-400">마감</span>
            <button onClick={onViewPending} className="text-[12px] font-semibold text-[#3B3EFF] bg-white border border-[#3B3EFF] rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12" /></svg>
              인증 실패
            </button>
          </>
        )}
        {userStatus === 'completed' && (
          <>
            <span className="text-[12px] text-zinc-400">마감</span>
            <button onClick={onViewPending} className="text-[12px] font-medium text-zinc-400 bg-zinc-100 rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
              인증 완료
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function LeaderCard({ m, onViewSubmissions, onEdit, onDelete }: {
  m: MissionData; onViewSubmissions: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const scope = getScope(m.missionType);
  const deadline = getDeadlineText(m.missionEndDtm);
  return (
    <div className="bg-white rounded-lg px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-200 shrink-0" />
        <div className="flex-1 min-w-0">
          <Badges scope={scope} />
          <p className="text-[12px] font-medium text-zinc-800 leading-tight">{m.missionTitle}</p>
          <p className="text-[11px] text-zinc-400 mt-1 truncate">{m.missionContent}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          {deadline
            ? <p className="text-[12px]"><span className="text-zinc-800">마감까지 </span><span className={deadlineColor(deadline)}>{deadline}</span></p>
            : <span className="text-[12px] text-zinc-400">마감</span>}
          <button onClick={onViewSubmissions} className="text-[12px] font-semibold text-white bg-[#3B3EFF] rounded-lg px-3.5 py-1.5 whitespace-nowrap">
            제출 확인
          </button>
        </div>
      </div>
      {/* 수정/삭제 버튼 */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100">
        <button onClick={onEdit}
          className="flex-1 py-1.5 rounded-lg border border-zinc-200 text-[12px] font-medium text-zinc-500 flex items-center justify-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          수정
        </button>
        <button onClick={onDelete}
          className="flex-1 py-1.5 rounded-lg border border-red-100 text-[12px] font-medium text-red-400 flex items-center justify-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          </svg>
          삭제
        </button>
      </div>
    </div>
  );
}

function StatusBar({ value, onChange }: { value: StatusFilter; onChange: (v: StatusFilter) => void }) {
  return (
    <div className="flex items-center justify-center mb-3">
      {(['전체', '진행 중', '완료'] as StatusFilter[]).map((f, i) => (
        <div key={f} className="flex items-center">
          <button onClick={() => onChange(f)} className={`text-[13px] px-2 ${value === f ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}>{f}</button>
          {i < 2 && <span className="text-zinc-300 text-[13px]">|</span>}
        </div>
      ))}
    </div>
  );
}

export default function MissionsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [scopeTab,     setScopeTab]     = useState<ScopeTab>('전체');
  const [leaderTab,    setLeaderTab]    = useState<LeaderTab>('공통');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('전체');
  const [execMode,     setExecMode]     = useState(false); // 수행 모드 토글
  const [deleteTarget, setDeleteTarget] = useState<MissionData | null>(null);

  const { data: myMember } = useQuery<MemberMe>({
    queryKey: ['memberMe', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/me?teamId=${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const isLeader = myMember?.memRole === 'L' && myMember?.memState === 'A';

  const { data: missions = [], isLoading: missionsLoading } = useQuery<MissionData[]>({
    queryKey: ['missions', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/missions?teamId=${id}`);
      return data.data ?? [];
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: (missionId: number) => api.delete(`/api/missions/${missionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions', id] });
      setDeleteTarget(null);
    },
    onError: () => alert('삭제에 실패했습니다.'),
  });

  // 멤버 시점 (수행 모드 포함)
  const submissionQueries = useQueries({
    queries: missions.map((m) => ({
      queryKey: ['mySubmission', m.missionId],
      queryFn: async (): Promise<{ verifyState: string } | null> => {
        try {
          const { data } = await api.get(`/api/missions/${m.missionId}/submissions/me`);
          return data.data ?? null;
        } catch { return null; }
      },
      retry: false,
      enabled: (!isLeader || execMode) && !!id && missions.length > 0,
    })),
  });

  const getUserStatus = (idx: number): UserStatus => {
    const q = submissionQueries[idx];
    if (!q || q.isLoading || !q.data) return 'available';
    const state = q.data.verifyState;
    if (state === 'A' || state === 'F') return 'completed';
    if (state === 'R') return 'failed';
    return 'pending';
  };

  const missionParams = (m: MissionData) =>
    `?authType=${encodeURIComponent('AI인증')}&scope=${encodeURIComponent(getScope(m.missionType))}&title=${encodeURIComponent(m.missionTitle)}&subtitle=${encodeURIComponent(m.missionContent.substring(0, 50))}`;

  // 멤버 뷰 필터
  const memberMissions = missions
    .map((m, idx) => ({ m, idx }))
    .filter(({ m, idx }) => {
      const scope = getScope(m.missionType);
      if (scopeTab !== '전체' && scope !== scopeTab) return false;
      const dl = getDeadlineText(m.missionEndDtm);
      const userStatus = getUserStatus(idx);
      if (statusFilter === '진행 중') return (!!dl && userStatus !== 'completed') || userStatus === 'pending';
      if (statusFilter === '완료') return userStatus === 'completed';
      return true;
    });

  // 리더 관리 뷰 필터
  const leaderMissions = (type: '공통' | '개인') =>
    missions.filter((m) => {
      if (getScope(m.missionType) !== type) return false;
      const dl = getDeadlineText(m.missionEndDtm);
      if (statusFilter === '진행 중') return !!dl;
      if (statusFilter === '완료') return !dl;
      return true;
    });

  if (missionsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <p className="text-[13px] text-zinc-400">불러오는 중...</p>
      </div>
    );
  }

  /* ── 리더 + 관리 모드 ── */
  if (isLeader && !execMode) {
    return (
      <div className="flex flex-col min-h-full">
        {/* 탭 + 수행모드 토글 */}
        <div className="sticky top-0 z-10 bg-white -mx-4">
          <div className="flex border-b border-zinc-200 items-center">
            {(['공통', '개인'] as LeaderTab[]).map((t) => (
              <button key={t} onClick={() => setLeaderTab(t)}
                className={`flex-1 flex justify-center text-[13px] font-medium transition-colors ${leaderTab === t ? 'text-zinc-900' : 'text-zinc-400'}`}>
                <span className={`inline-block py-2.5 -mb-px ${leaderTab === t ? 'border-b-2 border-zinc-900' : ''}`}>{t}</span>
              </button>
            ))}
            {/* 수행모드 토글 */}
            <button
              onClick={() => setExecMode(true)}
              className="flex items-center gap-1 pr-4 pl-2 py-2.5 text-[12px] font-medium text-zinc-400 whitespace-nowrap"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              수행모드
            </button>
          </div>
        </div>

        <div className="flex-1 -mx-4 -mb-5 bg-zinc-100 px-4 pt-4 pb-24 space-y-3">
          <StatusBar value={statusFilter} onChange={setStatusFilter} />
          {leaderMissions(leaderTab).length === 0
            ? <p className="text-center text-[13px] text-zinc-400 py-10">미션이 없습니다.</p>
            : leaderMissions(leaderTab).map((m) => (
              <LeaderCard
                key={m.missionId}
                m={m}
                onViewSubmissions={() => router.push(`/${id}/missions/${m.missionId}/submissions${missionParams(m)}`)}
                onEdit={() => router.push(`/${id}/missions/${m.missionId}/edit`)}
                onDelete={() => setDeleteTarget(m)}
              />
            ))
          }
        </div>

        {/* 미션 생성 버튼 */}
        <button
          onClick={() => router.push(`/${id}/missions/new`)}
          className="fixed bottom-[80px] w-12 h-12 bg-[#3B3EFF] rounded-full flex items-center justify-center shadow-lg z-20"
          style={{ right: 'calc(50% - 195px + 24px)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {deleteTarget && (
          <DeleteMissionPopup
            title={deleteTarget.missionTitle}
            onConfirm={() => deleteMutation.mutate(deleteTarget.missionId)}
            onCancel={() => setDeleteTarget(null)}
            isPending={deleteMutation.isPending}
          />
        )}
      </div>
    );
  }

  /* ── 멤버 뷰 (or 리더 수행모드) ── */
  return (
    <div className="flex flex-col min-h-full">
      {/* 탭 */}
      <div className="sticky top-0 z-10 bg-white -mx-4">
        <div className="flex border-b border-zinc-200 items-center">
          {(['전체', '공통', '개인'] as ScopeTab[]).map((t) => (
            <button key={t} onClick={() => setScopeTab(t)}
              className={`flex-1 flex justify-center text-[13px] font-medium transition-colors ${scopeTab === t ? 'text-zinc-900' : 'text-zinc-400'}`}>
              <span className={`inline-block py-2.5 -mb-px ${scopeTab === t ? 'border-b-2 border-zinc-900' : ''}`}>{t}</span>
            </button>
          ))}
          {/* 리더: 수행모드 → 관리모드 복귀 버튼 */}
          {isLeader && (
            <button
              onClick={() => setExecMode(false)}
              className="flex items-center gap-1 pr-4 pl-2 py-2.5 text-[12px] font-medium text-[#3B3EFF] whitespace-nowrap"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              관리모드
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 -mx-4 -mb-5 bg-zinc-100 px-4 pt-4 pb-24 space-y-3">
        {isLeader && execMode && (
          <div className="flex items-center gap-2 bg-[#EBEBFF] rounded-xl px-3 py-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B3EFF" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-[12px] text-[#3B3EFF] font-medium">수행 모드: 멤버 시점으로 미션을 확인합니다.</p>
          </div>
        )}
        <StatusBar value={statusFilter} onChange={setStatusFilter} />
        {memberMissions.length === 0
          ? <p className="text-center text-[13px] text-zinc-400 py-10">미션이 없습니다.</p>
          : memberMissions.map(({ m, idx }) => {
            const deadline = getDeadlineText(m.missionEndDtm);
            const userStatus = getUserStatus(idx);
            const params = missionParams(m);
            return (
              <MemberMissionCard
                key={m.missionId}
                m={m}
                deadline={deadline}
                userStatus={userStatus}
                onVerify={() => router.push(`/${id}/missions/${m.missionId}/verify${params}`)}
                onViewPending={() => router.push(`/${id}/missions/${m.missionId}/pending${params}`)}
              />
            );
          })
        }
      </div>

      {/* 리더는 수행모드에서도 생성 버튼 표시 */}
      {isLeader && (
        <button
          onClick={() => router.push(`/${id}/missions/new`)}
          className="fixed bottom-[80px] w-12 h-12 bg-[#3B3EFF] rounded-full flex items-center justify-center shadow-lg z-20"
          style={{ right: 'calc(50% - 195px + 24px)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
    </div>
  );
}
