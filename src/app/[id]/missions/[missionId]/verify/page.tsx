'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useHeaderSlotStore } from '@/store/headerSlot';

const SCOPE_COLOR: Record<string, string> = { 공통: '#FF9E6A', 개인: '#E5638C' };
const AUTH_COLOR: Record<string, string> = { 'AI인증': '#3B3EFF', '수동인증': '#31DBD5' };

export default function MissionVerifyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPageHeader } = useHeaderSlotStore();

  const authType = searchParams.get('authType') ?? 'AI인증';
  const scope = searchParams.get('scope') ?? '공통';
  const title = searchParams.get('title') ?? '';
  const subtitle = searchParams.get('subtitle') ?? '';
  const isAI = authType === 'AI인증';

  const [images, setImages] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPageHeader({ title: '미션 인증하기', hideHamburger: true });
    return () => setPageHeader(null);
  }, [setPageHeader]);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((f) => {
      const url = URL.createObjectURL(f);
      setImages((prev) => (prev.length < 3 ? [...prev, url] : prev));
    });
    e.target.value = '';
  };

  const handleRemoveImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  };

  const canSubmit = isAI ? images.length > 0 : text.trim().length > 0;

  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex flex-col gap-4">

      {/* 미션 정보 카드 */}
      <div className="bg-white rounded-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
          {isAI ? (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex gap-1.5 mb-1.5">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: SCOPE_COLOR[scope] ?? '#FF9E6A' }}>
              {scope}
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: AUTH_COLOR[authType] ?? '#3B3EFF' }}>
              {authType}
            </span>
          </div>
          <p className="text-[14px] font-bold text-zinc-900 leading-snug">{title}</p>
          <p className="text-[12px] text-zinc-400 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {isAI ? (
        /* AI 인증 */
        <>
          <div className="flex flex-col gap-3">
            <p className="text-[14px] font-semibold text-zinc-800">인증 사진 첨부</p>
            <div className="flex gap-2.5">
              {images.map((src, i) => (
                <div key={i} className="relative w-[88px] h-[88px] rounded-xl overflow-hidden bg-zinc-100 shrink-0">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-white/80 rounded-full flex items-center justify-center"
                  >
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-[88px] h-[88px] rounded-xl border-2 border-dashed border-zinc-200 hover:border-[#3B3EFF] flex items-center justify-center text-[#3B3EFF] shrink-0 transition-colors"
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
          </div>

          {/* AI 안내 */}
          <div className="flex items-start gap-2 bg-[#EEF0FF] rounded-xl px-4 py-3">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#3B3EFF" strokeWidth={2} className="shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-[12px] text-[#3B3EFF] leading-relaxed">
              AI가 사진을 자동으로 분석해요.
            </p>
          </div>
        </>
      ) : (
        /* 수동 인증 */
        <>
          <div className="flex flex-col gap-2">
            <p className="text-[14px] font-semibold text-zinc-800">인증 내용 작성</p>
            <div className="bg-white rounded-xl p-4 flex flex-col gap-1.5">
              <textarea
                className="w-full h-28 text-[14px] text-zinc-800 placeholder:text-zinc-300 outline-none resize-none bg-transparent"
                placeholder="인증 내용을 간단히 설명해주세요."
                maxLength={300}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <p className="text-[12px] text-zinc-300 text-right">{text.length}/300</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-semibold text-zinc-800">
              파일 또는 사진 첨부 <span className="text-zinc-400 font-normal text-[13px]">(선택)</span>
            </label>
            <button
              onClick={() => attachInputRef.current?.click()}
              className="w-full border-2 border-dashed border-[#3B3EFF]/50 rounded-xl bg-white px-6 py-10 flex flex-col items-center gap-3 transition-colors hover:border-[#3B3EFF] hover:bg-blue-50"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#EBEBFF] flex items-center justify-center">
                <svg width="30" height="30" fill="none" viewBox="0 0 24 24">
                  <path d="M12 15V4M12 4L8.5 7.5M12 4L15.5 7.5" stroke="#3B3EFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 17v1.75C4 19.993 4.895 21 6 21h12c1.105 0 2-1.007 2-2.25V17" stroke="#3B3EFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[15px] font-bold text-zinc-800">
                {file ? file.name : '파일 첨부하기'}
              </p>
              <p className="text-[13px] text-zinc-400 text-center leading-relaxed">
                탭하여 파일을 선택하거나 여기로 끌어다 놓으세요
              </p>
            </button>
            <input ref={attachInputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </>
      )}

      {/* 제출 버튼 */}
      <button
        disabled={!canSubmit}
        className="w-full h-[52px] bg-[#3B3EFF] text-white rounded-2xl text-[15px] font-bold disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors mt-2"
      >
        인증 제출하기
      </button>
    </div>
  );
}