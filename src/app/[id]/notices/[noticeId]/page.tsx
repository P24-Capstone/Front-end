'use client';

import { useParams, useRouter } from 'next/navigation';
import { NOTICES } from '../page';

export default function NoticeDetailPage() {
  const { noticeId } = useParams<{ noticeId: string }>();
  const router = useRouter();

  const notice = NOTICES.find((n) => n.id === noticeId);

  if (!notice) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-[14px] text-zinc-400">공지를 찾을 수 없습니다.</p>
        <button onClick={() => router.back()} className="text-[13px] text-blue-500">돌아가기</button>
      </div>
    );
  }

  return (
    <div className="px-1">
      {/* 제목 */}
      <div className="pb-5 border-b border-zinc-100">
        <div className="flex items-center gap-2 mb-2">
          {notice.isRequired && (
            <span className="text-[11px] font-semibold text-white bg-blue-500 rounded-full px-2 py-0.5 shrink-0">
              필독
            </span>
          )}
          {notice.isPinned && (
            <span className="text-[11px] font-medium text-zinc-400">고정됨</span>
          )}
        </div>
        <h1 className="text-[18px] font-bold text-zinc-900 break-words">{notice.title}</h1>
      </div>

      {/* 날짜 · 작성자 */}
      <div className="flex items-center gap-4 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span className="text-[12px] text-zinc-400">{notice.date}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-[12px] text-zinc-400">{notice.author}</span>
        </div>
      </div>

      {/* 내용 */}
      <div className="pt-5">
        {notice.content.split('\n').map((line, i) => (
          <p key={i} className="text-[14px] text-zinc-700 leading-relaxed mb-1">{line}</p>
        ))}
      </div>
    </div>
  );
}
