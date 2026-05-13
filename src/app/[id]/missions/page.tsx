'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

type ScopeTab = '전체' | '공통' | '개인';
type KindFilter = '전체' | '폼미션' | '자유미션';

interface MemberMe {
  memRole: string;
  memState: string;
}

interface Mission {
  id: string;
  scope: '공통' | '개인';
  authType: 'AI인증' | '수동인증';
  title: string;
  status: '가능' | '대기' | '실패' | '완료';
  deadline: string | null;
  kind: '폼미션' | '자유미션';
}

const MOCK_MISSIONS: Mission[] = [
  { id: '1', scope: '공통', authType: 'AI인증',   title: '한강, 채식주의자 독서인증!', status: '가능', deadline: '1시간', kind: '폼미션' },
  { id: '2', scope: '개인', authType: '수동인증', title: '독서 후 감상문 작성하기!',   status: '대기', deadline: '30분',  kind: '자유미션' },
  { id: '3', scope: '공통', authType: '수동인증', title: '독서 후 감상문 작성하기!',   status: '가능', deadline: '3일',   kind: '폼미션' },
  { id: '4', scope: '개인', authType: 'AI인증',   title: '카프카, 변신 독서인증!',     status: '대기', deadline: null,   kind: '자유미션' },
  { id: '5', scope: '개인', authType: '수동인증', title: '독서 후 감상문 작성하기!',   status: '실패', deadline: null,   kind: '자유미션' },
  { id: '6', scope: '개인', authType: '수동인증', title: '독서 후 감상문 작성하기!',   status: '실패', deadline: null,   kind: '폼미션' },
  { id: '7', scope: '개인', authType: 'AI인증',   title: '카프카, 변신 독서인증!',     status: '완료', deadline: null,   kind: '자유미션' },
];

const SCOPE_TAG: Record<string, string> = {
  공통: 'bg-green-400 text-white',
  개인: 'bg-blue-400 text-white',
};
const AUTH_TAG: Record<string, string> = {
  'AI인증':  'bg-sky-400 text-white',
  '수동인증': 'bg-violet-400 text-white',
};

function deadlineColor(deadline: string | null): string {
  if (!deadline) return 'text-zinc-400';
  if (deadline.includes('분') || deadline.includes('시간')) return 'text-[#f97316]';
  const days = Number(deadline.replace(/[^0-9]/g, ''));
  return days <= 3 ? 'text-[#f97316]' : 'text-[#3B3EFF]';
}

function Tag({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cls}`}>{label}</span>
  );
}

const STATUS_LABEL: Record<string, string> = {
  가능: '진행 중',
  대기: '진행 중',
  실패: '인증 실패',
  완료: '인증 완료',
};

function MissionCard({ m }: { m: Mission }) {
  const isDone = m.status === '실패' || m.status === '완료';
  const isActive = m.status === '가능' || m.status === '대기';

  return (
    <div className="flex items-center gap-3 py-3 border-b border-zinc-100">
      <div className={`w-10 h-10 rounded-full shrink-0 ${isDone ? 'bg-zinc-300' : 'bg-zinc-200'}`} />

      <div className="flex-1 min-w-0">
        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mb-1 ${
          isActive ? 'bg-[#3B3EFF] text-white' : 'bg-zinc-100 text-zinc-400'
        }`}>
          {STATUS_LABEL[m.status]}
        </span>
        <p className="text-[12px] font-medium text-zinc-800 leading-tight">{m.title}</p>
        <p className="text-[11px] text-zinc-400 mt-1">{m.scope} · {m.authType}</p>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-2">
        {m.status === '가능' && (
          <>
            <button className="text-[11px] px-2.5 py-1 rounded-full border border-[#3B3EFF] text-[#3B3EFF] font-medium whitespace-nowrap">
              인증하기
            </button>
            <p className="text-[10px]">
              <span className="text-zinc-800">마감까지 </span>
              <span className={deadlineColor(m.deadline)}>{m.deadline}</span>
            </p>
          </>
        )}
        {m.status === '대기' && (
          <>
            <button className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-200 text-zinc-500 font-medium whitespace-nowrap cursor-default">
              승인 대기
            </button>
            <p className="text-[10px]">
              {m.deadline ? (
                <>
                  <span className="text-zinc-800">마감까지 </span>
                  <span className={deadlineColor(m.deadline)}>{m.deadline}</span>
                </>
              ) : (
                <span className="text-zinc-400">마감</span>
              )}
            </p>
          </>
        )}
        {isDone && (
          <span className="text-[10px] text-zinc-400">마감</span>
        )}
      </div>
    </div>
  );
}

export default function MissionsPage() {
  const { id } = useParams<{ id: string }>();
  const [scopeTab, setScopeTab] = useState<ScopeTab>('전체');
  const [kindFilter, setKindFilter] = useState<KindFilter>('전체');

  const { data: myMember } = useQuery<MemberMe>({
    queryKey: ['memberMe', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/me?teamId=${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const isLeader = myMember?.memRole === 'L' && myMember?.memState === 'A';

  const filtered = MOCK_MISSIONS.filter((m) => {
    if (scopeTab === '공통' && m.scope !== '공통') return false;
    if (scopeTab === '개인' && m.scope !== '개인') return false;
    if (kindFilter !== '전체' && m.kind !== kindFilter) return false;
    return true;
  });

  return (
    <div className="-mx-4 -my-5">
      {/* 상단 탭 + 서브 필터 (같이 sticky) */}
      <div className="sticky top-0 z-10 bg-white">
        <div className="flex border-b border-zinc-200">
          {(['전체', '공통', '개인'] as ScopeTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setScopeTab(t)}
              className={`flex-1 flex justify-center text-[13px] font-medium transition-colors whitespace-nowrap ${
                scopeTab === t ? 'text-zinc-900' : 'text-zinc-400'
              }`}
            >
              <span className={`inline-block py-2.5 -mb-px ${scopeTab === t ? 'border-b-2 border-zinc-900' : ''}`}>
                {t}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center py-2.5 border-b border-zinc-100">
          {(['전체', '폼미션', '자유미션'] as KindFilter[]).map((f, i, arr) => (
            <div key={f} className="flex items-center">
              <button
                onClick={() => setKindFilter(f)}
                className={`text-[13px] px-3 ${kindFilter === f ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}
              >
                {f}
              </button>
              {i < arr.length - 1 && <span className="text-zinc-200 text-[13px]">|</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 미션 목록 */}
      <div className="px-4 pt-4 pb-24">
        {filtered.length === 0 ? (
          <p className="text-center text-[13px] text-zinc-400 py-10">미션이 없습니다.</p>
        ) : (
          filtered.map((m) => <MissionCard key={m.id} m={m} />)
        )}
      </div>

      {/* 팀장 전용 플로팅 버튼 */}
      {isLeader && (
        <button
          className="fixed bottom-[80px] w-12 h-12 bg-[#3B3EFF] rounded-full flex items-center justify-center shadow-lg z-20"
          style={{ right: 'calc(50% - 195px + 24px)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
    </div>
  );
}