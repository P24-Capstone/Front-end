'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useHeaderSlotStore } from '@/store/headerSlot';
import api from '@/lib/api';

const INPUT_CLS = 'w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-[14px] text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-[#3B3EFF] transition-colors bg-white';

interface MemberResponse {
  memId: string;
  memNic: string;
  memRole: string;
  memState: string;
  imgFileKey: string | null;
}

interface UploadedFile {
  name: string;   // 원본 파일명 (UI 표시용)
  url: string;    // S3 URL (서버 전송용)
}

export default function MissionNewPage() {
  const router       = useRouter();
  const { id }       = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setPageHeader } = useHeaderSlotStore();

  /* ── 멤버 목록 ── */
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['members', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members?teamId=${id}`);
      return (data.data as MemberResponse[]).filter((m) => m.memState === 'A');
    },
    enabled: !!id,
  });

  /* ── 폼 상태 ── */
  const [title,            setTitle]            = useState('');
  const [scope,            setScope]            = useState<'공통' | '개인'>('공통');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [startDate,        setStartDate]        = useState('');
  const [endDate,          setEndDate]          = useState('');
  const [content,          setContent]          = useState('');
  const [verifyPrompt,     setVerifyPrompt]     = useState('');
  const [uploadedFiles,    setUploadedFiles]    = useState<UploadedFile[]>([]);
  const [uploading,        setUploading]        = useState(false);
  const [isSubmitting,     setIsSubmitting]     = useState(false);

  useEffect(() => {
    setPageHeader({ title: '미션 생성', hideHamburger: true });
    return () => setPageHeader(null);
  }, [setPageHeader]);

  const canSubmit =
    title.trim() &&
    startDate &&
    endDate &&
    content.trim() &&
    !uploading &&
    (scope === '공통' || !!selectedMemberId);

  /* ── 파일 선택 → 즉시 S3 업로드 ── */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    // 이미 업로드된 파일 포함 최대 5개 제한
    const remaining = 5 - uploadedFiles.length;
    const targets   = files.slice(0, remaining);

    setUploading(true);
    try {
      const results = await Promise.all(
        targets.map(async (file) => {
          const form = new FormData();
          form.append('file', file);
          const { data } = await api.post('/api/files/upload?type=mission', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return { name: file.name, url: data.data as string };
        })
      );
      setUploadedFiles((prev) => [...prev, ...results]);
    } catch {
      alert('파일 업로드에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setUploading(false);
      // input 초기화 (같은 파일 재선택 허용)
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (idx: number) =>
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));

  /* ── 등록 ── */
  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.post('/api/missions', {
        missionTitle:    title.trim(),
        missionContent:  content.trim(),
        missionType:     scope === '개인' ? 'P' : 'A',
        verifyPrompt:    verifyPrompt.trim() || null,
        missionStartDtm: `${startDate} 00:00:00`,
        missionEndDtm:   `${endDate} 23:59:59`,
        teamId:          id,
        memIds:          scope === '개인' && selectedMemberId ? [selectedMemberId] : [],
        fileKeys:        uploadedFiles.map((f) => f.url),
      });
      router.back();
    } catch (err) {
      console.error('미션 등록 실패:', err);
      alert('미션 등록에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex flex-col gap-4">

      {/* 기본 정보 카드 */}
      <div className="bg-white rounded-xl p-4 flex flex-col gap-4">

        {/* 미션명 */}
        <div>
          <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">미션명</label>
          <input
            className={INPUT_CLS}
            placeholder="예) 책 읽고 인증하기"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* 대상자 */}
        <div className="flex flex-col gap-2">
          <label className="block text-[13px] font-medium text-zinc-500">대상자</label>
          <div className="flex gap-2">
            {(['공통', '개인'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setScope(s); setSelectedMemberId(null); }}
                className={`flex-1 py-2.5 rounded-lg border text-[14px] font-medium transition-colors ${
                  scope === s
                    ? 'bg-[#3B3EFF] border-[#3B3EFF] text-white'
                    : 'border-zinc-200 text-zinc-400 bg-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {scope === '개인' && (
            <div className="flex flex-col gap-2">
              <p className="text-[12px] text-zinc-400">부여할 멤버를 선택해주세요.</p>
              {membersLoading ? (
                <p className="text-[12px] text-zinc-400 py-2">불러오는 중...</p>
              ) : (members ?? []).length === 0 ? (
                <p className="text-[12px] text-zinc-400 py-2">활동 중인 멤버가 없습니다.</p>
              ) : (
                (members ?? []).map((mem) => (
                  <button
                    key={mem.memId}
                    onClick={() => setSelectedMemberId(mem.memId)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                      selectedMemberId === mem.memId
                        ? 'border-[#3B3EFF] bg-[#EBEBFF]'
                        : 'border-zinc-200 bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#C4B5FD] flex items-center justify-center shrink-0 overflow-hidden">
                      {mem.imgFileKey ? (
                        <img src={mem.imgFileKey} alt="프로필" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[12px] font-bold text-white">{mem.memNic?.[0] ?? '?'}</span>
                      )}
                    </div>
                    <span className={`text-[14px] font-medium ${selectedMemberId === mem.memId ? 'text-[#3B3EFF]' : 'text-zinc-800'}`}>
                      {mem.memNic}
                    </span>
                    {mem.memRole === 'L' && (
                      <span className="text-[10px] font-semibold text-white bg-[#3B3EFF] rounded-full px-1.5 py-0.5">리더</span>
                    )}
                    {selectedMemberId === mem.memId && (
                      <svg className="ml-auto shrink-0" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#3B3EFF" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* 시작일 / 마감일 */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">미션 시작일</label>
            <input
              type="date"
              className={INPUT_CLS}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">미션 마감일</label>
            <input
              type="date"
              className={INPUT_CLS}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 미션 내용 카드 */}
      <div className="bg-white rounded-xl p-4">
        <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">미션 내용</label>
        <textarea
          className={`${INPUT_CLS} resize-none h-28`}
          placeholder="미션에 대해 자세히 설명해 주세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {/* AI 인증 조건 카드 */}
      <div className="bg-white rounded-xl p-4">
        <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">
          AI 인증 조건 <span className="text-zinc-300 font-normal">(선택)</span>
        </label>
        <textarea
          className={`${INPUT_CLS} resize-none h-20`}
          placeholder="예) 책 표지와 본인 얼굴이 함께 나온 사진이어야 합니다."
          value={verifyPrompt}
          onChange={(e) => setVerifyPrompt(e.target.value)}
        />
        <p className="text-[11px] text-zinc-400 mt-1.5">
          입력하지 않으면 AI가 미션 내용을 기준으로 자동 판단합니다.
        </p>
      </div>

      {/* 파일 첨부 카드 */}
      <div className="bg-white rounded-xl px-4 py-3.5 flex flex-col gap-3">
        {/* 숨긴 파일 input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* 첨부 버튼 */}
        <button
          type="button"
          disabled={uploading || uploadedFiles.length >= 5}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-3 text-zinc-400 active:text-zinc-600 transition-colors w-full disabled:opacity-40"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          <span className="text-[14px]">
            {uploading ? '업로드 중...' : '파일 첨부 (이미지, 최대 5개)'}
          </span>
          {uploadedFiles.length > 0 && (
            <span className="ml-auto text-[12px] font-medium text-[#3B3EFF]">
              {uploadedFiles.length}/5
            </span>
          )}
        </button>

        {/* 첨부된 파일 목록 */}
        {uploadedFiles.length > 0 && (
          <ul className="flex flex-col gap-2">
            {uploadedFiles.map((file, i) => (
              <li key={i} className="flex items-center gap-2 bg-zinc-50 rounded-lg px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="flex-1 min-w-0 text-[13px] text-zinc-700 truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="shrink-0 text-zinc-400 active:text-zinc-600 p-0.5"
                  aria-label="파일 제거"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 등록 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        className="w-full h-[52px] bg-[#3B3EFF] text-white rounded-2xl text-[15px] font-bold disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors mt-2"
      >
        {isSubmitting ? '등록 중...' : '미션 등록'}
      </button>
    </div>
  );
}
