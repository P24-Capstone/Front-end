'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHeaderSlotStore } from '@/store/headerSlot';
import api from '@/lib/api';

const INPUT_CLS = 'w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-[14px] text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-[#3B3EFF] transition-colors bg-white';

interface UploadedFile { name: string; url: string; }

export default function MissionEditPage() {
  const { id, missionId } = useParams<{ id: string; missionId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setPageHeader } = useHeaderSlotStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title,         setTitle]         = useState('');
  const [startDate,     setStartDate]     = useState('');
  const [endDate,       setEndDate]       = useState('');
  const [content,       setContent]       = useState('');
  const [verifyPrompt,  setVerifyPrompt]  = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading,     setUploading]     = useState(false);
  const [isSubmitting,  setIsSubmitting]  = useState(false);

  const { data: mission, isLoading } = useQuery({
    queryKey: ['mission', missionId],
    queryFn: async () => {
      const { data } = await api.get(`/api/missions/${missionId}`);
      return data.data;
    },
    enabled: !!missionId,
  });

  useEffect(() => {
    setPageHeader({ title: '미션 수정', hideHamburger: true });
    return () => setPageHeader(null);
  }, [setPageHeader]);

  useEffect(() => {
    if (mission) {
      setTitle(mission.missionTitle ?? '');
      setContent(mission.missionContent ?? '');
      setVerifyPrompt(mission.verifyPrompt ?? '');
      setStartDate((mission.missionStartDtm ?? '').slice(0, 10));
      setEndDate((mission.missionEndDtm ?? '').slice(0, 10));
      const existingFiles: UploadedFile[] = (mission.fileKeys ?? []).map((url: string) => ({
        name: url.split('/').pop() ?? url,
        url,
      }));
      setUploadedFiles(existingFiles);
    }
  }, [mission]);

  const canSubmit = title.trim() && startDate && endDate && content.trim() && !uploading;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const remaining = 5 - uploadedFiles.length;
    const targets = files.slice(0, remaining);
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
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (idx: number) =>
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));

  const updateMutation = useMutation({
    mutationFn: () =>
      api.put(`/api/missions/${missionId}`, {
        missionTitle:    title.trim(),
        missionContent:  content.trim(),
        verifyPrompt:    verifyPrompt.trim() || null,
        missionStartDtm: `${startDate} 00:00:00`,
        missionEndDtm:   `${endDate} 23:59:59`,
        fileKeys:        uploadedFiles.map((f) => f.url),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions', id] });
      queryClient.invalidateQueries({ queryKey: ['mission', missionId] });
      router.back();
    },
    onError: () => alert('수정에 실패했습니다. 다시 시도해 주세요.'),
  });

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    updateMutation.mutate(undefined, { onSettled: () => setIsSubmitting(false) });
  };

  if (isLoading) {
    return (
      <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 flex items-center justify-center">
        <p className="text-[14px] text-zinc-400">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex flex-col gap-4">

      {/* 기본 정보 */}
      <div className="bg-white rounded-xl p-4 flex flex-col gap-4">
        <div>
          <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">미션명</label>
          <input className={INPUT_CLS} placeholder="예) 책 읽고 인증하기" value={title}
            onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">미션 시작일</label>
            <input type="date" className={INPUT_CLS} value={startDate}
              onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">미션 마감일</label>
            <input type="date" className={INPUT_CLS} value={endDate}
              onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* 미션 내용 */}
      <div className="bg-white rounded-xl p-4">
        <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">미션 내용</label>
        <textarea className={`${INPUT_CLS} resize-none h-28`}
          placeholder="미션에 대해 자세히 설명해 주세요."
          value={content} onChange={(e) => setContent(e.target.value)} />
      </div>

      {/* AI 인증 조건 */}
      <div className="bg-white rounded-xl p-4">
        <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">
          AI 인증 조건 <span className="text-zinc-300 font-normal">(선택)</span>
        </label>
        <textarea className={`${INPUT_CLS} resize-none h-20`}
          placeholder="예) 책 표지와 본인 얼굴이 함께 나온 사진이어야 합니다."
          value={verifyPrompt} onChange={(e) => setVerifyPrompt(e.target.value)} />
        <p className="text-[11px] text-zinc-400 mt-1.5">입력하지 않으면 AI가 미션 내용을 기준으로 자동 판단합니다.</p>
      </div>

      {/* 파일 첨부 */}
      <div className="bg-white rounded-xl px-4 py-3.5 flex flex-col gap-3">
        <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif" multiple
          className="hidden" onChange={handleFileChange} />
        <button type="button"
          disabled={uploading || uploadedFiles.length >= 5}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-3 text-zinc-400 active:text-zinc-600 transition-colors w-full disabled:opacity-40"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          <span className="text-[14px]">{uploading ? '업로드 중...' : '파일 첨부 (이미지, 최대 5개)'}</span>
          {uploadedFiles.length > 0 && (
            <span className="ml-auto text-[12px] font-medium text-[#3B3EFF]">{uploadedFiles.length}/5</span>
          )}
        </button>

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
                <button type="button" onClick={() => removeFile(i)}
                  className="shrink-0 text-zinc-400 active:text-zinc-600 p-0.5" aria-label="파일 제거">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}
        className="w-full h-[52px] bg-[#3B3EFF] text-white rounded-2xl text-[15px] font-bold disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors mt-2">
        {isSubmitting ? '수정 중...' : '수정 완료'}
      </button>
    </div>
  );
}
