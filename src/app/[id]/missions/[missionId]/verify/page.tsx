'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useHeaderSlotStore } from '@/store/headerSlot';
import api from '@/lib/api';

const SCOPE_COLOR: Record<string, string> = { 공통: '#FF9E6A', 개인: '#E5638C' };

interface MissionDetail {
  missionId:       number;
  missionTitle:    string;
  missionContent:  string;
  missionType:     string;
  verifyPrompt:    string | null;
  missionStartDtm: string;
  missionEndDtm:   string;
  fileKeys:        string[];  // 모임장이 첨부한 참고 파일
}

/** "YYYY-MM-DD HH:mm:ss" → "YYYY.MM.DD" */
function fmtDate(dtm: string): string {
  return dtm.slice(0, 10).replace(/-/g, '.');
}

export default function MissionVerifyPage() {
  const { id, missionId } = useParams<{ id: string; missionId: string }>();
  const router             = useRouter();
  const searchParams       = useSearchParams();
  const { setPageHeader }  = useHeaderSlotStore();

  /* URL 파라미터는 fallback 으로만 사용 */
  const scopeParam  = searchParams.get('scope')  ?? '공통';
  const titleParam  = searchParams.get('title')  ?? '';

  const [imageItems, setImageItems] = useState<{ file: File; preview: string }[]>([]);
  const [text,       setText]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPageHeader({ title: '미션 인증하기', hideHamburger: true });
    return () => setPageHeader(null);
  }, [setPageHeader]);

  /* ── 미션 상세 조회: 접근 권한 확인 + 실제 데이터 취득 ── */
  const { data: mission, isLoading, isError } = useQuery<MissionDetail>({
    queryKey: ['mission', missionId],
    queryFn: async () => {
      const { data } = await api.get(`/api/missions/${missionId}`);
      return data.data as MissionDetail;
    },
    retry: false,
    enabled: !!missionId,
  });

  /* API 에서 가져온 실제 값 우선, 없으면 URL 파라미터 사용 */
  const scope        = mission?.missionType === 'P' ? '개인' : scopeParam;
  const title        = mission?.missionTitle ?? titleParam;
  const verifyPrompt = mission?.verifyPrompt ?? '';

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((f) => {
      if (imageItems.length < 3)
        setImageItems((prev) => [...prev, { file: f, preview: URL.createObjectURL(f) }]);
    });
    e.target.value = '';
  };

  const handleRemoveImage = (i: number) =>
    setImageItems((prev) => prev.filter((_, idx) => idx !== i));

  const canSubmit = imageItems.length > 0 && !submitting;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
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
        verifyContent: text.trim(),
        imageUrl,
        teamId:        id,
      });

      router.back();
    } catch {
      alert('인증 제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 로딩 ── */
  if (isLoading) {
    return (
      <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex items-center justify-center">
        <p className="text-[13px] text-zinc-400">미션 정보를 불러오는 중...</p>
      </div>
    );
  }

  /* ── 접근 불가 (개인 미션 비대상자 또는 존재하지 않는 미션) ── */
  if (isError) {
    return (
      <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={1.8}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
            <circle cx="12" cy="16" r="0.8" fill="#ef4444" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-[15px] font-bold text-zinc-900">접근 권한이 없어요</p>
          <p className="text-[13px] text-zinc-400 mt-1">이 미션의 인증 대상자가 아닙니다.</p>
        </div>
        <button
          onClick={() => router.back()}
          className="mt-2 px-6 h-[44px] bg-zinc-800 text-white rounded-2xl text-[14px] font-semibold"
        >
          돌아가기
        </button>
      </div>
    );
  }

  /* ── 인증 폼 ── */
  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex flex-col gap-4">

      {/* ── 미션 정보 카드 ── */}
      <div className="bg-white rounded-xl p-4 flex flex-col gap-3">
        {/* 배지 + 제목 */}
        <div className="flex items-start gap-3">
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
          </div>
        </div>

        {/* 시작일 / 마감일 */}
        {mission && (
          <div className="flex gap-4 border-t border-zinc-50 pt-3">
            <div className="flex-1">
              <p className="text-[10px] font-medium text-zinc-400 mb-0.5">시작일</p>
              <p className="text-[13px] font-semibold text-zinc-700">{fmtDate(mission.missionStartDtm)}</p>
            </div>
            <div className="w-px bg-zinc-100" />
            <div className="flex-1">
              <p className="text-[10px] font-medium text-zinc-400 mb-0.5">마감일</p>
              <p className="text-[13px] font-semibold text-zinc-700">{fmtDate(mission.missionEndDtm)}</p>
            </div>
          </div>
        )}

        {/* 미션 내용 */}
        {mission?.missionContent && (
          <div className="border-t border-zinc-50 pt-3">
            <p className="text-[11px] font-medium text-zinc-400 mb-1">미션 내용</p>
            <p className="text-[13px] text-zinc-700 leading-relaxed whitespace-pre-wrap">{mission.missionContent}</p>
          </div>
        )}
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

      {/* ── 참고 파일 (모임장이 첨부한 파일) ── */}
      {(mission?.fileKeys ?? []).length > 0 && (
        <div className="bg-white rounded-xl px-4 py-3.5 flex flex-col gap-2">
          <p className="text-[13px] font-semibold text-zinc-700">참고 파일</p>
          <div className="flex flex-col gap-1.5">
            {mission!.fileKeys.map((url, i) => {
              const name = url.split('/').pop() ?? `파일 ${i + 1}`;
              const isImg = /\.(png|jpe?g|gif|webp|heic|heif)$/i.test(url);
              return (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-zinc-50 rounded-lg px-3 py-2 active:bg-zinc-100 transition-colors"
                >
                  {isImg ? (
                    <div className="w-8 h-8 rounded-md overflow-hidden bg-zinc-200 shrink-0">
                      <img src={url} alt={name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-md bg-[#EBEBFF] flex items-center justify-center shrink-0">
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#3B3EFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    </div>
                  )}
                  <span className="flex-1 min-w-0 text-[13px] text-zinc-700 truncate">{name}</span>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#a1a1aa" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              );
            })}
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

      {/* ── 인증 설명 (선택) ── */}
      <div className="bg-white rounded-xl p-4 flex flex-col gap-2">
        <div>
          <p className="text-[14px] font-semibold text-zinc-800">
            인증 설명{' '}
            <span className="text-zinc-400 font-normal text-[12px]">(선택)</span>
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">사진에 대해 AI에게 한 줄로 설명해 주세요.</p>
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
