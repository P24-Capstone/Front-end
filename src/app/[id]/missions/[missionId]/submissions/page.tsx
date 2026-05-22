'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useHeaderSlotStore } from '@/store/headerSlot';

const MOCK_SUBMISSIONS = [
  { id: '1', memberName: '김철수', initial: '김', submittedAt: '14:32', authType: 'AI인증',   status: 'pending',   aiResult: 'approved' },
  { id: '2', memberName: '이영희', initial: '이', submittedAt: '13:15', authType: 'AI인증',   status: 'failed',    aiResult: 'rejected' },
  { id: '3', memberName: '박지수', initial: '박', submittedAt: '11:40', authType: '수동인증',  status: 'pending',   aiResult: null },
  { id: '4', memberName: '최민준', initial: '최', submittedAt: '10:05', authType: '수동인증',  status: 'completed', aiResult: null },
];

const SCOPE_COLOR: Record<string, string> = { 공통: '#FF9E6A', 개인: '#E5638C' };
const AUTH_COLOR: Record<string, string> = { 'AI인증': '#3B3EFF', '수동인증': '#31DBD5' };

const STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  pending:   { text: '대기', color: '#f59e0b', bg: '#fffbeb' },
  completed: { text: '완료', color: '#10b981', bg: '#ecfdf5' },
  failed:    { text: '거절', color: '#ef4444', bg: '#fef2f2' },
};

function resolvedStatus(s: typeof MOCK_SUBMISSIONS[0]) {
  if (s.authType === 'AI인증' && s.aiResult === 'approved') return 'completed';
  return s.status;
}

export default function SubmissionsPage() {
  const { id, missionId } = useParams<{ id: string; missionId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPageHeader } = useHeaderSlotStore();
  const title = searchParams.get('title') ?? '미션';
  const authType = searchParams.get('authType') ?? 'AI인증';
  const scope = searchParams.get('scope') ?? '공통';
  const subtitle = searchParams.get('subtitle') ?? '';
  const isAI = authType === 'AI인증';

  useEffect(() => {
    setPageHeader({ title: '제출 현황', hideHamburger: true });
    return () => setPageHeader(null);
  }, [setPageHeader]);

  const byType = MOCK_SUBMISSIONS.filter((s) => s.authType === authType);
  const pendingCount = byType.filter((s) => resolvedStatus(s) === 'pending').length;
  const completedCount = byType.filter((s) => resolvedStatus(s) === 'completed').length;

  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex flex-col gap-4">

      {/* 미션 정보 */}
      <div className="bg-white rounded-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
          {isAI ? (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex gap-1.5 mb-1.5">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: SCOPE_COLOR[scope] ?? '#FF9E6A' }}>{scope}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: AUTH_COLOR[authType] ?? '#3B3EFF' }}>{authType}</span>
          </div>
          <p className="text-[14px] font-bold text-zinc-900 leading-snug">{title}</p>
          <p className="text-[12px] text-zinc-400 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* 통계 */}
      <div className="bg-white rounded-xl p-4">
        <div className="flex gap-3">
          <div className="flex-1 bg-zinc-50 rounded-lg py-2.5 flex flex-col items-center gap-0.5">
            <span className="text-[18px] font-bold text-amber-500">{pendingCount}</span>
            <span className="text-[11px] text-zinc-400">대기</span>
          </div>
          <div className="flex-1 bg-zinc-50 rounded-lg py-2.5 flex flex-col items-center gap-0.5">
            <span className="text-[18px] font-bold text-emerald-500">{completedCount}</span>
            <span className="text-[11px] text-zinc-400">완료</span>
          </div>
          <div className="flex-1 bg-zinc-50 rounded-lg py-2.5 flex flex-col items-center gap-0.5">
            <span className="text-[18px] font-bold text-zinc-800">{byType.length}</span>
            <span className="text-[11px] text-zinc-400">전체</span>
          </div>
        </div>
      </div>

      {/* 제출 목록 */}
      <div className="flex flex-col gap-2">
        {byType.length === 0 ? (
          <p className="text-center text-[13px] text-zinc-400 py-10">제출 내역이 없습니다.</p>
        ) : byType.map((s) => {
          const status = resolvedStatus(s);
          const st = STATUS_LABEL[status];
          const href = `/${id}/missions/${missionId}/submissions/${s.id}?authType=${encodeURIComponent(s.authType)}&scope=${encodeURIComponent(scope)}&title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subtitle)}&memberName=${encodeURIComponent(s.memberName)}&aiResult=${s.aiResult ?? ''}`;
          return (
            <button key={s.id} onClick={() => router.push(href)}
              className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3 text-left w-full">
              <div className="w-9 h-9 rounded-full bg-[#C4B5FD] flex items-center justify-center shrink-0">
                <span className="text-[13px] font-bold text-white">{s.initial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-zinc-900">{s.memberName}</p>
                {s.authType === 'AI인증' && s.aiResult && (
                  <span className={`text-[10px] font-medium mt-0.5 ${s.aiResult === 'approved' ? 'text-emerald-500' : 'text-red-400'}`}>
                    AI {s.aiResult === 'approved' ? '승인' : '거절'}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: st.color, backgroundColor: st.bg }}>
                  {st.text}
                </span>
                <span className="text-[11px] text-zinc-400">{s.submittedAt}</span>
              </div>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#d4d4d8" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}