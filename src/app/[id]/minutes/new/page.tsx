'use client';

import { useRouter, useParams } from 'next/navigation';
import { useRef } from 'react';

export default function MinutesNewPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 업로드 선택 시 → record 페이지로 파일 전달
  // sessionStorage를 활용해 파일 객체를 임시 보관
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 지원 형식 검증
    const allowed = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-m4a', 'audio/mp4'];
    if (!allowed.includes(file.type)) {
      alert('지원하지 않는 형식입니다.\nmp3, wav, m4a 파일만 업로드 가능합니다.');
      return;
    }

    // 파일을 sessionStorage에 임시 저장 후 record 페이지로 이동
    // (실제로는 File 객체를 직접 전달할 수 없으므로 전역 상태 또는 URL params 활용)
    // 여기서는 record 페이지에서 처리하도록 query string으로 mode만 전달
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    // window.__uploadedAudio 에 임시 보관 (가장 심플한 방법)
    (window as any).__uploadedAudio = file;
    router.push(`/${id}/minutes/recode?mode=upload`);
  };

  return (
    <div className="flex flex-col min-h-full bg-zinc-100">
      {/* 헤더 */}
      <div className="flex items-center px-4 py-5 gap-3">
        <button
          onClick={() => router.back()}
          className="text-zinc-500 text-[14px]"
        >
          ← 돌아가기
        </button>
        <span className="flex-1 text-center text-[16px] font-semibold text-zinc-800 pr-14">
          새 회의록
        </span>
      </div>

      {/* 선택 카드 영역 */}
      <div className="flex flex-col gap-4 px-4 pt-4">

        {/* 녹음 시작 카드 */}
        <button
          onClick={() => router.push(`/${id}/minutes/recode?mode=record`)}
          className="bg-white rounded-2xl px-5 py-6 flex items-center gap-4 active:bg-zinc-50 transition-colors text-left w-full"
        >
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#E24B4A" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" />
              <line x1="8" y1="23" x2="16" y2="23" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-zinc-800">녹음 시작</p>
            <p className="text-[13px] text-zinc-400 mt-0.5">
              지금 바로 회의를 녹음합니다
            </p>
          </div>
          <svg className="ml-auto text-zinc-300" width="18" height="18" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* 파일 업로드 카드 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-white rounded-2xl px-5 py-6 flex items-center gap-4 active:bg-zinc-50 transition-colors text-left w-full"
        >
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#378ADD" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              <polyline strokeLinecap="round" strokeLinejoin="round"
                points="16 8 12 4 8 8" />
              <line x1="12" y1="4" x2="12" y2="16" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-zinc-800">파일 업로드</p>
            <p className="text-[13px] text-zinc-400 mt-0.5">
              mp3, wav, m4a 파일 지원
            </p>
          </div>
          <svg className="ml-auto text-zinc-300" width="18" height="18" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* 숨겨진 파일 input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mpeg,audio/mp3,audio/wav,audio/x-m4a,audio/mp4,.mp3,.wav,.m4a"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}