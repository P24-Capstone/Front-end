'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useHeaderSlotStore } from '@/store/headerSlot';
import api from '@/lib/api';

const SCOPE_COLOR: Record<string, string> = { 공통: '#FF9E6A', 개인: '#E5638C' };
const AUTH_COLOR: Record<string, string> = { 'AI인증': '#3B3EFF', '수동인증': '#31DBD5' };

const STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  pending:   { text: '대기', color: '#f59e0b', bg: '#fffbeb' },
  completed: { text: '완료', color: '#10b981', bg: '#ecfdf5' },
  failed:    { text: '거절', color: '#ef4444', bg: '#fef2f2' },
};

interface VerifyItem {
  verifyId: number;
  memNic: string;
  verifyRegDtm: string;
  verifyState: string;
  aiRejectYn: string | null;
  aiResult: string | null;
  fileKeys: string[];
}

function resolveStatus(item: VerifyItem): 'pending' | 'completed' | 'failed' {
  if (item.verifyState === 'A') return 'completed';
  if (item.verifyState === 'R') return 'failed';
  if (item.aiRejectYn === 'Y') return 'failed';
  return 'pending';
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

  const { data: submissions = [], isLoading } = useQuery<VerifyItem[]>({
    queryKey: ['submissions', missionId],
    queryFn: async () => {
      const { data } = await api.get(`/api/missions/${missionId}/submissions`);
      return data.data as VerifyItem[];
    },
  });

  const pendingCount = submissions.filter((s) => resolveStatus(s) === 'pending').length;
  const completedCount = submissions.filter((s) => resolveStatus(s) === 'completed').length;

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
            <span className="text-[18px] font-bold text-zinc-800">{submissions.length}</span>
            <span className="text-[11px] text-zinc-400">전체</span>
          </div>
        </div>
      </div>

      {/* 제출 목록 */}
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <p className="text-center text-[13px] text-zinc-400 py-10">불러오는 중...</p>
        ) : submissions.length === 0 ? (
          <p className="text-center text-[13px] text-zinc-400 py-10">제출 내역이 없습니다.</p>
        ) : submissions.map((s) => {
          const status = resolveStatus(s);
          const st = STATUS_LABEL[status];
          const submittedTime = s.verifyRegDtm?.substring(11, 16) ?? '';
          const aiResultLabel = s.aiRejectYn === 'N' ? 'approved' : s.aiRejectYn === 'Y' ? 'rejected' : null;
          const href = `/${id}/missions/${missionId}/submissions/${s.verifyId}?authType=${encodeURIComponent(authType)}&scope=${encodeURIComponent(scope)}&title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subtitle)}&memberName=${encodeURIComponent(s.memNic)}&aiResult=${aiResultLabel ?? ''}`;
          return (
            <button key={s.verifyId} onClick={() => router.push(href)}
              className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3 text-left w-full">
              <div className="w-9 h-9 rounded-full bg-[#C4B5FD] flex items-center justify-center shrink-0">
                <span className="text-[13px] font-bold text-white">{s.memNic[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-zinc-900">{s.memNic}</p>
                {isAI && aiResultLabel && (
                  <span className={`text-[10px] font-medium mt-0.5 ${aiResultLabel === 'approved' ? 'text-emerald-500' : 'text-red-400'}`}>
                    AI {aiResultLabel === 'approved' ? '승인' : '거절'}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: st.color, backgroundColor: st.bg }}>
                  {st.text}
                </span>
                <span className="text-[11px] text-zinc-400">{submittedTime}</span>
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