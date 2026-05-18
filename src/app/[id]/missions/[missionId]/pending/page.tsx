'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useHeaderSlotStore } from '@/store/headerSlot';

const SCOPE_COLOR: Record<string, string> = { 공통: '#FF9E6A', 개인: '#E5638C' };
const AUTH_COLOR: Record<string, string> = { 'AI인증': '#3B3EFF', '수동인증': '#31DBD5' };

// TODO: 백엔드 연결 시 API로 교체
const MOCK_SUBMISSION_AI = {
  submittedAt: '2025-05-18 14:32',
  images: 2,
  text: '',
  fileName: '',
  rejectionReason: '',
};
const MOCK_SUBMISSION_MANUAL = {
  submittedAt: '2025-05-18 11:10',
  images: 0,
  text: '채식주의자를 읽고 주인공 영혜의 심리 변화에 대해 감상문을 작성했습니다. 영혜가 꿈을 통해 폭력성을 인식하고 채식을 선택하는 과정이 인상 깊었습니다.',
  fileName: '감상문_한강_채식주의자.pdf',
  rejectionReason: '제출하신 파일이 미션 내용과 맞지 않아요.',
};

type Status = 'pending' | 'completed' | 'failed';

const HEADER_TITLE: Record<Status, string> = {
  pending: '제출한 인증',
  completed: '인증 완료',
  failed: '인증 실패',
};

function MissionInfoCard({ scope, authType, title, subtitle, isAI }: {
  scope: string; authType: string; title: string; subtitle: string; isAI: boolean;
}) {
  return (
    <div className="bg-white rounded-xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
        {isAI ? (
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
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
  );
}

export default function MissionPendingPage() {
  const { id, missionId } = useParams<{ id: string; missionId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPageHeader } = useHeaderSlotStore();

  const authType = searchParams.get('authType') ?? 'AI인증';
  const scope = searchParams.get('scope') ?? '공통';
  const title = searchParams.get('title') ?? '';
  const subtitle = searchParams.get('subtitle') ?? '';
  const status = (searchParams.get('status') ?? 'pending') as Status;
  const isAI = authType === 'AI인증';
  const submission = isAI ? MOCK_SUBMISSION_AI : MOCK_SUBMISSION_MANUAL;

  useEffect(() => {
    setPageHeader({ title: HEADER_TITLE[status], hideHamburger: true });
    return () => setPageHeader(null);
  }, [setPageHeader, status]);

  const verifyHref = `/${id}/missions/${missionId}/verify?authType=${encodeURIComponent(authType)}&scope=${encodeURIComponent(scope)}&title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subtitle)}`;

  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex flex-col gap-4">

      <MissionInfoCard scope={scope} authType={authType} title={title} subtitle={subtitle} isAI={isAI} />

      {/* 상태 배너 */}
      {status === 'pending' && (
        <div className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-zinc-800">승인 대기 중</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">제출일: {submission.submittedAt}</p>
          </div>
          <span className="text-[11px] font-semibold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full">대기</span>
        </div>
      )}

      {status === 'completed' && (
        <div className="bg-emerald-50 rounded-xl px-4 py-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-zinc-800">인증이 완료됐어요!</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">제출일: {submission.submittedAt}</p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full">완료</span>
        </div>
      )}

      {status === 'failed' && (
        <div className="bg-red-50 rounded-xl px-4 py-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-zinc-800">
              {isAI ? 'AI가 인식하지 못했어요' : '인증이 거절됐어요'}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">제출일: {submission.submittedAt}</p>
          </div>
          <span className="text-[11px] font-semibold text-red-500 bg-red-100 px-2.5 py-1 rounded-full">실패</span>
        </div>
      )}

      {/* 거절 사유 (수동인증 실패 시) */}
      {status === 'failed' && !isAI && submission.rejectionReason && (
        <div className="flex flex-col gap-2">
          <p className="text-[14px] font-semibold text-zinc-800">거절 사유</p>
          <div className="bg-white rounded-xl p-4 border border-red-100">
            <p className="text-[13px] text-zinc-600 leading-relaxed">{submission.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* 제출 내용 */}
      {isAI ? (
        <>
          <p className="text-[14px] font-semibold text-zinc-800">제출한 사진</p>
          <div className="flex gap-2.5">
            {/* TODO: 백엔드 연결 시 실제 이미지 URL로 교체 */}
            {Array.from({ length: submission.images }).map((_, i) => (
              <div key={i} className="w-[88px] h-[88px] rounded-xl bg-zinc-200 shrink-0 flex items-center justify-center">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#a1a1aa" strokeWidth={1.5}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            ))}
          </div>
          {status === 'pending' && (
            <div className="flex items-start gap-2 bg-[#EEF0FF] rounded-xl px-4 py-3">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#3B3EFF" strokeWidth={2} className="shrink-0 mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-[12px] text-[#3B3EFF] leading-relaxed">AI가 사진을 분석 중이에요. 인증 결과는 보통 1분 이내에 나와요.</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <p className="text-[14px] font-semibold text-zinc-800">인증 내용</p>
            <div className="bg-white rounded-xl p-4">
              <p className="text-[14px] text-zinc-700 leading-relaxed whitespace-pre-wrap">{submission.text}</p>
            </div>
          </div>
          {submission.fileName && (
            <div className="flex flex-col gap-2">
              <p className="text-[14px] font-semibold text-zinc-800">첨부 파일</p>
              <div className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EBEBFF] flex items-center justify-center shrink-0">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#3B3EFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </div>
                <p className="text-[13px] text-zinc-800 truncate">{submission.fileName}</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* 다시 제출하기 (실패 시) */}
      {status === 'failed' && (
        <button
          onClick={() => router.push(verifyHref)}
          className="w-full h-[52px] bg-[#3B3EFF] text-white rounded-2xl text-[15px] font-bold mt-2"
        >
          다시 제출하기
        </button>
      )}
    </div>
  );
}