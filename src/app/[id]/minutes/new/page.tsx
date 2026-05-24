'use client';

import { useRouter, useParams } from 'next/navigation';
import { useRef, useEffect } from 'react';
import { useHeaderSlotStore } from '@/store/headerSlot';

export default function MinutesNewPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setPageHeader } = useHeaderSlotStore();

  useEffect(() => {
    setPageHeader({ title: '회의록 생성하기', hideHamburger: true });
    return () => setPageHeader(null);
  }, [setPageHeader]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-m4a', 'audio/mp4'];
    if (!allowed.includes(file.type)) {
      alert('지원하지 않는 형식입니다.\nmp3, wav, m4a 파일만 업로드 가능합니다.');
      return;
    }

    (window as any).__uploadedAudio = file;
    router.push(`/${id}/minutes/recode?mode=upload`);
  };

  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-6 pb-10 flex flex-col gap-4">

      <p className="text-[13px] text-zinc-400 px-1">회의록을 만들 방법을 선택해주세요.</p>

      {/* 녹음 시작 */}
      <button
        onClick={() => router.push(`/${id}/minutes/recode?mode=record`)}
        className="bg-white rounded-2xl p-5 flex items-center gap-4 active:bg-zinc-50 transition-colors text-left w-full shadow-sm"
      >
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#E24B4A" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" />
            <line x1="8" y1="23" x2="16" y2="23" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-zinc-900">녹음 시작</p>
          <p className="text-[13px] text-zinc-400 mt-0.5">지금 바로 회의를 녹음합니다</p>
        </div>
        <svg className="text-zinc-300 shrink-0" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* 파일 업로드 */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="bg-white rounded-2xl p-5 flex items-center gap-4 active:bg-zinc-50 transition-colors text-left w-full shadow-sm"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#EBEBFF] flex items-center justify-center shrink-0">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#3B3EFF" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            <polyline strokeLinecap="round" strokeLinejoin="round" points="16 8 12 4 8 8" />
            <line x1="12" y1="4" x2="12" y2="16" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-zinc-900">파일 업로드</p>
          <p className="text-[13px] text-zinc-400 mt-0.5">mp3, wav, m4a 파일 지원</p>
        </div>
        <svg className="text-zinc-300 shrink-0" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/wav,audio/x-m4a,audio/mp4,.mp3,.wav,.m4a"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}