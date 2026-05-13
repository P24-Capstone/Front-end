'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

type ScopeTab = '전체' | '공통' | '개인';
type StatusFilter = '전체' | '진행 중' | '완료';

interface MemberMe {
  memRole: string;
  memState: string;
}

interface Mission {
  id: string;
  scope: '공통' | '개인';
  authType: 'AI인증' | '수동인증';
  title: string;
  subtitle: string;
  status: '가능' | '대기' | '실패' | '완료';
  deadline: string | null;
  kind: '폼미션' | '자유미션';
}

const MOCK_MISSIONS: Mission[] = [
  { id: '1', scope: '공통', authType: 'AI인증',   title: '한강, 채식주의자 독서인증!', subtitle: '책 사진 찍고 인증하기',   status: '가능', deadline: '1시간', kind: '폼미션' },
  { id: '2', scope: '개인', authType: '수동인증', title: '독서 후 감상문 작성하기!',   subtitle: '감상문 파일 업로드',      status: '대기', deadline: '30분',  kind: '자유미션' },
  { id: '3', scope: '공통', authType: '수동인증', title: '독서 후 감상문 작성하기!',   subtitle: '감상문 파일 업로드',      status: '가능', deadline: '3일',   kind: '폼미션' },
  { id: '4', scope: '개인', authType: 'AI인증',   title: '카프카, 변신 독서인증!',     subtitle: '책 사진 찍고 인증하기',   status: '대기', deadline: null,   kind: '자유미션' },
  { id: '5', scope: '개인', authType: '수동인증', title: '독서 후 감상문 작성하기!',   subtitle: '감상문 파일 업로드',      status: '실패', deadline: null,   kind: '자유미션' },
  { id: '6', scope: '개인', authType: '수동인증', title: '독서 후 감상문 작성하기!',   subtitle: '감상문 파일 업로드',      status: '실패', deadline: null,   kind: '폼미션' },
  { id: '7', scope: '개인', authType: 'AI인증',   title: '카프카, 변신 독서인증!',     subtitle: '책 사진 찍고 인증하기',   status: '완료', deadline: null,   kind: '자유미션' },
  { id: '8', scope: '공통', authType: '수동인증', title: '한강, 채식주의자 독서인증!', subtitle: '책 사진 찍고 인증하기',   status: '완료', deadline: '5일',   kind: '폼미션' },
];

const SCOPE_COLOR: Record<string, string> = {
  공통: '#FF9E6A',
  개인: '#E5638C',
};
const AUTH_COLOR: Record<string, string> = {
  'AI인증':  '#3B3EFF',
  '수동인증': '#31DBD5',
};

function deadlineColor(deadline: string | null): string {
  if (!deadline) return 'text-zinc-400';
  if (deadline.includes('분') || deadline.includes('시간')) return 'text-[#f97316]';
  const days = Number(deadline.replace(/[^0-9]/g, ''));
  return days <= 3 ? 'text-[#f97316]' : 'text-[#3B3EFF]';
}

function MissionCard({ m }: { m: Mission }) {
  const isDone = m.status === '실패' || m.status === '완료';

  return (
    <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full shrink-0 ${isDone ? 'bg-zinc-300' : 'bg-zinc-200'}`} />

      <div className="flex-1 min-w-0">
        <div className="flex gap-1 mb-1">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: SCOPE_COLOR[m.scope] }}>
            {m.scope}
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: AUTH_COLOR[m.authType] }}>
            {m.authType}
          </span>
        </div>
        <p className="text-[12px] font-medium text-zinc-800 leading-tight">{m.title}</p>
        <p className="text-[11px] text-zinc-400 mt-1">{m.subtitle}</p>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-2">
        {m.status === '가능' && (
          <>
            <p className="text-[12px]">
              <span className="text-zinc-800">마감까지 </span>
              <span className={deadlineColor(m.deadline)}>{m.deadline}</span>
            </p>
            <button className="text-[12px] font-semibold text-white bg-[#3B3EFF] rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              인증하기
            </button>
          </>
        )}
        {m.status === '대기' && (
          <>
            <p className="text-[12px]">
              {m.deadline ? (
                <>
                  <span className="text-zinc-800">마감까지 </span>
                  <span className={deadlineColor(m.deadline)}>{m.deadline}</span>
                </>
              ) : (
                <span className="text-zinc-400">마감</span>
              )}
            </p>
            <button className="text-[12px] font-semibold text-white bg-[#3B3EFF] rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap cursor-default">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              승인 대기
            </button>
          </>
        )}
        {m.status === '실패' && (
          <>
            <span className="text-[12px] text-zinc-800">마감</span>
            <button className="text-[12px] font-semibold text-[#3B3EFF] bg-white border border-[#3B3EFF] rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap cursor-default">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              인증 실패
            </button>
          </>
        )}
        {m.status === '완료' && (
          <>
            {m.deadline ? (
              <p className="text-[12px]">
                <span className="text-zinc-800">마감까지 </span>
                <span className={deadlineColor(m.deadline)}>{m.deadline}</span>
              </p>
            ) : (
              <span className="text-[10px] text-zinc-400">마감</span>
            )}
            <button className="text-[12px] font-medium text-zinc-400 bg-zinc-100 rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap cursor-default">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
              인증 완료
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function MissionsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [scopeTab, setScopeTab] = useState<ScopeTab>('전체');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('전체');
  const [showPopup, setShowPopup] = useState(false);

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
    if (statusFilter === '진행 중' && m.status !== '가능' && m.status !== '대기' && m.status !== '실패') return false;
    if (statusFilter === '완료' && m.status !== '완료') return false;
    return true;
  });

  return (
    <div className="flex flex-col min-h-full">
      {/* 상단 탭 */}
      <div className="sticky top-0 z-10 bg-white -mx-4">
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
      </div>

      {/* 미션 목록 */}
      <div className="flex-1 -mx-4 -mb-5 bg-zinc-100 px-4 pt-4 pb-24 space-y-3">
        {/* 서브 필터 */}
        <div className="flex items-center justify-center mb-3">
          {(['전체', '진행 중', '완료'] as StatusFilter[]).map((f, i, arr) => (
            <div key={f} className="flex items-center">
              <button
                onClick={() => setStatusFilter(f)}
                className={`text-[13px] px-2 ${statusFilter === f ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}
              >
                {f}
              </button>
              {i < arr.length - 1 && <span className="text-zinc-300 text-[13px]">|</span>}
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-[13px] text-zinc-400 py-10">미션이 없습니다.</p>
        ) : (
          filtered.map((m) => <MissionCard key={m.id} m={m} />)
        )}
      </div>

      {/* 팀장 전용 플로팅 버튼 */}
      {isLeader && (
        <button
          onClick={() => setShowPopup(true)}
          className="fixed bottom-[80px] w-12 h-12 bg-[#3B3EFF] rounded-full flex items-center justify-center shadow-lg z-20"
          style={{ right: 'calc(50% - 195px + 24px)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      {/* 미션 종류 선택 팝업 */}
      {showPopup && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPopup(false)} />
          <div
            className="fixed z-50 bg-white rounded-xl shadow-xl w-[180px] overflow-hidden border border-zinc-100"
            style={{ bottom: 'calc(80px + 56px)', right: 'calc(50% - 195px + 16px)' }}
          >
            <button
              onClick={() => { setShowPopup(false); router.push(`/${id}/missions/new?kind=free`); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 active:bg-zinc-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-[13px] font-semibold text-zinc-900">자유형식 미션</span>
            </button>
            <div className="h-px bg-zinc-100" />
            <button
              onClick={() => { setShowPopup(false); router.push(`/${id}/missions/new?kind=form`); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 active:bg-zinc-50 transition-colors"
            >
              <div className="relative w-[18px] h-[18px] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="5" />
                  <path d="M3 21v-1a9 9 0 0 1 9-9h0a9 9 0 0 1 9 9v1" />
                </svg>
                <span className="absolute bottom-0 right-0 text-[6px] font-black leading-none bg-white text-zinc-800">AI</span>
              </div>
              <span className="text-[13px] font-semibold text-zinc-900">자동 폼 미션</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}