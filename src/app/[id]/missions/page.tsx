'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

type ScopeTab = '전체' | '공통' | '개인';
type StatusFilter = '전체' | '진행 중' | '완료' | '만료';
type UserStatus = 'available' | 'pending' | 'completed' | 'rejected' | 'expired';

interface MemberMe { memId: string; memRole: string; memState: string; }

interface MemberInfo {
  memId: string;
  memNic: string;
  imgFileKey: string | null;
}

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
  memberInfos: MemberInfo[]; // 개인 미션 대상자 정보
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

function MemberAvatars({ members }: { members: MemberInfo[] }) {
  if (!members || members.length === 0) return null;
  const show = members.slice(0, 3);
  const rest = members.length - show.length;
  return (
    <div className="flex items-center gap-1 mt-1.5">
      <div className="flex -space-x-1.5">
        {show.map((m) => (
          <div key={m.memId}
            className="w-5 h-5 rounded-full border border-white bg-[#C4B5FD] overflow-hidden shrink-0 flex items-center justify-center">
            {m.imgFileKey
              ? <img src={m.imgFileKey} alt={m.memNic} className="w-full h-full object-cover" />
              : <span className="text-[8px] font-bold text-white leading-none">{m.memNic[0]}</span>}
          </div>
        ))}
        {rest > 0 && (
          <div className="w-5 h-5 rounded-full border border-white bg-zinc-300 flex items-center justify-center">
            <span className="text-[8px] font-bold text-zinc-600">+{rest}</span>
          </div>
        )}
      </div>
      <span className="text-[10px] text-zinc-400 truncate max-w-[120px]">
        {show.map(m => m.memNic).join(', ')}{rest > 0 ? ` 외 ${rest}명` : ''}
      </span>
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
            <span className="font-medium text-zinc-600">&ldquo;{title}&rdquo;</span><br />
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
  const isDone = userStatus === 'completed' || userStatus === 'rejected' || userStatus === 'expired';
  return (
    <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full shrink-0 ${isDone ? 'bg-zinc-300' : 'bg-zinc-200'}`} />
      <div className="flex-1 min-w-0">
        <Badges scope={scope} />
        <p className="text-[12px] font-medium text-zinc-800 leading-tight">{m.missionTitle}</p>
        <p className="text-[11px] text-zinc-400 mt-1 truncate">{m.missionContent}</p>
        {m.missionType === 'P' && <MemberAvatars members={m.memberInfos ?? []} />}
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
        {userStatus === 'rejected' && (
          <>
            <span className="text-[12px] text-zinc-400">마감</span>
            <button onClick={onViewPending} className="text-[12px] font-semibold text-red-400 bg-white border border-red-200 rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12" /></svg>
              인증 반려
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
        {userStatus === 'expired' && (
          <span className="text-[12px] font-medium text-zinc-400 bg-zinc-100 rounded-lg px-3.5 py-1.5 whitespace-nowrap">
            기간 만료
          </span>
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
          {m.missionType === 'P' && <MemberAvatars members={m.memberInfos ?? []} />}
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
      {(['전체', '진행 중', '완료', '만료'] as StatusFilter[]).map((f, i) => (
        <div key={f} className="flex items-center">
          <button onClick={() => onChange(f)} className={`text-[13px] px-2 ${value === f ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}>{f}</button>
          {i < 3 && <span className="text-zinc-300 text-[13px]">|</span>}
        </div>
      ))}
    </div>
  );
}

export default function MissionsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [scopeTab,         setScopeTab]         = useState<ScopeTab>('전체');
  const [leaderScopeFilter, setLeaderScopeFilter] = useState<ScopeTab>('전체');
  const [statusFilter,     setStatusFilter]     = useState<StatusFilter>('전체');
  const [execMode,         setExecMode]         = useState(false);
  const [deleteTarget,     setDeleteTarget]     = useState<MissionData | null>(null);

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
    const dl = getDeadlineText(missions[idx]?.missionEndDtm ?? '');
    if (!q || q.isLoading) return dl ? 'available' : 'expired';
    if (!q.data) return dl ? 'available' : 'expired';
    const state = q.data.verifyState;
    if (state === 'A' || state === 'F') return 'completed';
    if (state === 'R') return 'rejected';
    return 'pending';
  };

  const missionParams = (m: MissionData) => {
    const params = new URLSearchParams({
      authType:      'AI인증',
      scope:         getScope(m.missionType),
      title:         m.missionTitle,
      subtitle:      m.missionContent.substring(0, 50),
      verifyPrompt:  m.verifyPrompt ?? '',
    });
    return `?${params.toString()}`;
  };

  // 멤버 뷰 필터
  const memberMissions = missions
    .map((m, idx) => ({ m, idx }))
    .filter(({ m, idx }) => {
      // 리더가 수행 모드일 때: 개인 미션(P)은 본인이 대상자인 것만 표시
      if (execMode && isLeader && m.missionType === 'P') {
        if (!myMember?.memId || !m.memIds.includes(myMember.memId)) return false;
      }
      const scope = getScope(m.missionType);
      if (scopeTab !== '전체' && scope !== scopeTab) return false;
      const userStatus = getUserStatus(idx);
      if (statusFilter === '진행 중') return userStatus === 'available' || userStatus === 'pending';
      if (statusFilter === '완료') return userStatus === 'completed' || userStatus === 'rejected';
      if (statusFilter === '만료') return userStatus === 'expired';
      return true;
    });

  // 리더 관리 뷰 필터
  const leaderFilteredMissions = missions.filter((m) => {
    const scope = getScope(m.missionType);
    if (leaderScopeFilter !== '전체' && scope !== leaderScopeFilter) return false;
    const dl = getDeadlineText(m.missionEndDtm);
    if (statusFilter === '진행 중') return !!dl;
    if (statusFilter === '완료' || statusFilter === '만료') return !dl;
    return true;
  });

  if (missionsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <p className="text-[13px] text-zinc-400">불러오는 중...</p>
      </div>
    );
  }

 /* ── 모드 토글 (리더 전용) ── */
  const ModeToggle = () => (
    <div className="flex items-center bg-zinc-100 rounded-full p-0.5 shrink-0 mr-3">
      <button
        onClick={() => setExecMode(false)}
        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap ${
          !execMode ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'
        }`}
      >
        관리
      </button>
      <button
        onClick={() => setExecMode(true)}
        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap ${
          execMode ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'
        }`}
      >
        수행
      </button>
    </div>
  );

  /* ── 리더 + 관리 모드 ── */
  if (isLeader && !execMode) {
    return (
      <div className="flex flex-col min-h-full">
        {/* 헤더: 상태 탭(1차) + 모드 토글 */}
        <div className="sticky top-0 z-10 bg-white -mx-4">
          <div className="flex border-b border-zinc-200 items-center">
            {(['전체', '진행 중', '완료'] as StatusFilter[]).map((t) => {
              const isActive = t === '완료'
                ? (statusFilter === '완료' || statusFilter === '만료')
                : statusFilter === t;
              return (
                <button key={t} onClick={() => setStatusFilter(t)}
                  className={`flex-1 flex justify-center text-[13px] font-medium transition-colors ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`}>
                  <span className={`inline-block py-2.5 -mb-px ${isActive ? 'border-b-2 border-zinc-900' : ''}`}>{t}</span>
                </button>
              );
            })}
            <ModeToggle />
          </div>
          {/* 범위 필터 (2차) — StatusBar 형태 */}
          <div className="flex items-center justify-center py-2 border-b border-zinc-100 bg-white">
            {(['전체', '공통', '개인'] as ScopeTab[]).map((s, i) => (
              <div key={s} className="flex items-center">
                <button onClick={() => setLeaderScopeFilter(s)}
                  className={`text-[13px] px-2 ${leaderScopeFilter === s ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}>
                  {s}
                </button>
                {i < 2 && <span className="text-zinc-300 text-[13px]">|</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 -mx-4 -mb-5 bg-zinc-100 px-4 pt-4 pb-24 space-y-3">
          {leaderFilteredMissions.length === 0
            ? <p className="text-center text-[13px] text-zinc-400 py-10">미션이 없습니다.</p>
            : leaderFilteredMissions.map((m) => (
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
      {/* 헤더: 범위 탭 + 모드 토글(리더만) */}
      <div className="sticky top-0 z-10 bg-white -mx-4">
        <div className="flex border-b border-zinc-200 items-center">
          {(['전체', '공통', '개인'] as ScopeTab[]).map((t) => (
            <button key={t} onClick={() => setScopeTab(t)}
              className={`flex-1 flex justify-center text-[13px] font-medium transition-colors ${scopeTab === t ? 'text-zinc-900' : 'text-zinc-400'}`}>
              <span className={`inline-block py-2.5 -mb-px ${scopeTab === t ? 'border-b-2 border-zinc-900' : ''}`}>{t}</span>
            </button>
          ))}
          {isLeader && <ModeToggle />}
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