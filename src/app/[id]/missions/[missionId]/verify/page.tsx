'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useHeaderSlotStore } from '@/store/headerSlot';
import api from '@/lib/api';

const SCOPE_COLOR: Record<string, string> = { 공통: '#FF9E6A', 개인: '#E5638C' };

export default function MissionVerifyPage() {
  const { id, missionId } = useParams<{ id: string; missionId: string }>();
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const { setPageHeader } = useHeaderSlotStore();

  const scope        = searchParams.get('scope')        ?? '공통';
  const title        = searchParams.get('title')        ?? '';
  const subtitle     = searchParams.get('subtitle')     ?? '';
  const verifyPrompt = searchParams.get('verifyPrompt') ?? '';

  const [imageItems, setImageItems] = useState<{ file: File; preview: string }[]>([]);
  const [text,       setText]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPageHeader({ title: '미션 인증하기', hideHamburger: true });
    return () => setPageHeader(null);
  }, [setPageHeader]);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((f) => {
      if (imageItems.length < 3) {
        setImageItems((prev) => [...prev, { file: f, preview: URL.createObjectURL(f) }]);
      }
    });
    e.target.value = '';
  };

  const handleRemoveImage = (i: number) => {
    setImageItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  /* 사진은 필수 */
  const canSubmit = imageItems.length > 0 && !submitting;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      /* 대표 이미지(첫 번째) 업로드 */
      const form = new FormData();
      form.append('file', imageItems[0].file);
      const { data: uploadRes } = await api.post(
        '/api/files/upload?type=missionVerify',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const imageUrl = uploadRes.data as string;

      await api.post('/api/missions/verify', {
        missionId:     Number(missionId),
        verifyContent: text.trim(),   // verify_content → AI 서버로 전달
        imageUrl,                     // image_url       → AI 서버로 전달
        teamId: Number(id),
      });

      router.back();
    } catch {
      alert('인증 제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex flex-col gap-4">

      {/* ── 미션 정보 카드 ── */}
      <div className="bg-white rounded-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex gap-1.5 mb-1.5">
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: SCOPE_COLOR[scope] ?? '#FF9E6A' }}
            >{scope}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white bg-[#3B3EFF]">
              AI 인증
            </span>
          </div>
          <p className="text-[14px] font-bold text-zinc-900 leading-snug">{title}</p>
          {subtitle && <p className="text-[12px] text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* ── AI 검증 기준 ── */}
      {verifyPrompt && (
        <div className="flex items-start gap-2 bg-[#EEF0FF] rounded-xl px-4 py-3">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#3B3EFF" strokeWidth={2} className="shrink-0 mt-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div>
            <p className="text-[11px] font-semibold text-[#3B3EFF] mb-0.5">AI 검증 기준</p>
            <p className="text-[12px] text-[#3B3EFF] leading-relaxed">{verifyPrompt}</p>
          </div>
        </div>
      )}

      {/* ── 인증 사진 첨부 (필수) ── */}
      <div className="bg-white rounded-xl p-4 flex flex-col gap-3">
        <div>
          <p className="text-[14px] font-semibold text-zinc-800">
            인증 사진 <span className="text-red-400 text-[12px] font-normal ml-0.5">*필수</span>
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">최대 3장 · 대표 사진: 첫 번째 이미지</p>
        </div>

        <div className="flex gap-2.5">
          {imageItems.map((img, i) => (
            <div key={i} className="relative w-[88px] h-[88px] rounded-xl overflow-hidden bg-zinc-100 shrink-0">
              <img src={img.preview} alt="" className="w-full h-full object-cover" />
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
          {imageItems.length < 3 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-[88px] h-[88px] rounded-xl border-2 border-dashed border-zinc-200 hover:border-[#3B3EFF] flex items-center justify-center text-[#3B3EFF] shrink-0 transition-colors"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5"  y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="hidden"
          onChange={handleImageAdd}
        />
      </div>

      {/* ── 인증 설명 (선택 · verify_content) ── */}
      <div className="bg-white rounded-xl p-4 flex flex-col gap-2">
        <div>
          <p className="text-[14px] font-semibold text-zinc-800">
            인증 설명{' '}
            <span className="text-zinc-400 font-normal text-[12px]">(선택)</span>
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            사진에 대해 AI에게 한 줄로 설명해 주세요.
          </p>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="예) 오늘 헬스장에서 벤치프레스 80kg 성공했습니다!"
          rows={2}
          maxLength={200}
          className="w-full text-[13px] text-zinc-800 placeholder:text-zinc-300 outline-none resize-none border border-zinc-200 rounded-lg px-3 py-2 focus:border-[#3B3EFF] transition-colors bg-transparent"
        />
        <p className="text-[11px] text-zinc-300 text-right">{text.length}/200</p>
      </div>

      {/* ── 제출 버튼 ── */}
      <button
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="w-full h-[52px] bg-[#3B3EFF] text-white rounded-2xl text-[15px] font-bold disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors mt-2"
      >
        {submitting ? '제출 중...' : '인증 제출하기'}
      </button>
    </div>
  );
}
