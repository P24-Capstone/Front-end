'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useHeaderSlotStore } from '@/store/headerSlot';
import api from '@/lib/api';

const INPUT_CLS = 'w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-[14px] text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-[#3B3EFF] transition-colors bg-white';

interface AudioFile {
  file: File;
  duration: string;
}

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readDuration(file: File): Promise<string> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const total = Math.floor(audio.duration);
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      resolve(h > 0 ? `${h}시간 ${m}분` : `${m}분`);
    };
    audio.onerror = () => { URL.revokeObjectURL(url); resolve(''); };
    audio.src = url;
  });
}

const STEPS = ['파일 업로드', '음성 → 텍스트 변환', '회의록 요약 생성 중', '저장'] as const;

function StepIcon({ status }: { status: 'done' | 'active' | 'waiting' }) {
  if (status === 'done') {
    return (
      <div className="w-6 h-6 rounded-full bg-[#3B3EFF] flex items-center justify-center shrink-0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (status === 'active') {
    return (
      <div className="w-6 h-6 rounded-full bg-[#EBEBFF] flex items-center justify-center shrink-0 animate-spin" style={{ animationDuration: '1.2s' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B3EFF" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 9A8 8 0 0 0 5.64 5.64M4 15a8 8 0 0 0 14.36 3.36" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 7v5l3 2" />
      </svg>
    </div>
  );
}

function GeneratingView({
  files,
  onCancel,
  currentStep,
  dots,
  error,
}: {
  files: AudioFile[];
  onCancel: () => void;
  currentStep: number;
  dots: string;
  error: boolean;
}) {
  return (
    <div className="-mx-4 -mb-5 min-h-full bg-[#F7F6FF] px-4 pt-6 pb-8 flex flex-col items-center">
      <div className="relative w-20 h-20 flex items-center justify-center mb-6 mt-4">
        <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '2s' }} viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#DDD9FF" strokeWidth="3.5" />
          <circle cx="40" cy="40" r="36" fill="none" stroke="#3B3EFF" strokeWidth="3.5"
            strokeDasharray="58 169" strokeLinecap="round" />
        </svg>
        <div className="w-14 h-14 rounded-full bg-[#E8E5FF] flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="#3B3EFF">
            <path d="M12 2l1.09 3.26L16.36 6.5l-3.27 1.24L12 11l-1.09-3.26L7.64 6.5l3.27-1.24L12 2z" />
            <path d="M18.5 10l.72 2.16L21.5 13l-2.28.84L18.5 16l-.72-2.16L15.5 13l2.28-.84L18.5 10z" />
            <path d="M6 14l.54 1.62L8 16.5l-1.46.88L6 19l-.54-1.62L4 16.5l1.46-.88L6 14z" />
          </svg>
        </div>
      </div>

      <p className="text-[18px] font-bold text-zinc-800 mb-8">
        {error ? 'AI 처리 중 오류가 발생했습니다' : 'AI가 요약하고 있어요'}
      </p>

      <div className="w-full bg-white rounded-2xl overflow-hidden mb-4">
        {STEPS.map((label, idx) => {
          const status = idx < currentStep ? 'done' : idx === currentStep ? 'active' : 'waiting';
          return (
            <div key={label} className={`flex items-center justify-between px-4 py-3.5 ${idx < STEPS.length - 1 ? 'border-b border-zinc-50' : ''}`}>
              <div className="flex items-center gap-3">
                <StepIcon status={status} />
                <span className={`text-[14px] font-medium ${status === 'waiting' ? 'text-zinc-400' : 'text-zinc-800'}`}>
                  {label}
                </span>
              </div>
              <span className={`text-[13px] font-medium ${status === 'waiting' ? 'text-zinc-300' : 'text-[#3B3EFF]'}`}>
                {status === 'done' ? '완료' : status === 'active' ? dots || '·' : '대기 중'}
              </span>
            </div>
          );
        })}
      </div>

      {files.map(({ file, duration }, idx) => (
        <div key={idx} className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#EBEBFF] flex items-center justify-center shrink-0">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#3B3EFF" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-zinc-800 truncate">{file.name}</p>
            <p className="text-[12px] text-zinc-400 mt-0.5">{formatSize(file.size)}{duration ? ` · ${duration}` : ''}</p>
          </div>
        </div>
      ))}

      <button
        onClick={onCancel}
        className="w-full border border-zinc-200 bg-transparent text-[15px] font-medium text-zinc-600 py-3.5 rounded-xl"
      >
        취소
      </button>
    </div>
  );
}

export default function MinutesCreatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setPageHeader } = useHeaderSlotStore();
  const [title, setTitle] = useState('');
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPageHeader({ title: '회의록 생성하기', hideHamburger: true });
    return () => setPageHeader(null);
  }, [setPageHeader]);

  const createMutation = useMutation({
    mutationFn: (recFileKey: string) =>
      api.post('/api/meeting-records', { teamId: id, recFileKey }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-records', id] });
      router.back();
    },
    onError: () => {
      setCurrentStep(0);
    },
  });

  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '·'));
    }, 400);
    const t1 = setTimeout(() => setCurrentStep(1), 600);
    const t2 = setTimeout(() => setCurrentStep(2), 1500);
    const t3 = setTimeout(() => {
      setCurrentStep(3);
      const fileKey = files[0]?.file.name ?? 'recording';
      createMutation.mutate(fileKey);
    }, 2500);
    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generating]);

  async function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const arr = Array.from(incoming);
    const withDurations = await Promise.all(
      arr.map(async (file) => ({ file, duration: await readDuration(file) }))
    );
    setFiles((prev) => [...prev, ...withDurations]);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function startGenerating() {
    setCurrentStep(0);
    setDots('');
    setGenerating(true);
  }

  if (generating) {
    return (
      <GeneratingView
        files={files}
        onCancel={() => { setGenerating(false); createMutation.reset(); }}
        currentStep={currentStep}
        dots={dots}
        error={createMutation.isError}
      />
    );
  }

  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex flex-col gap-5">
      <div className="bg-white rounded-xl p-4">
        <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">
          회의록 제목 <span className="text-zinc-300 font-normal">(선택)</span>
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="미입력 시 AI가 자동으로 생성합니다"
          className={INPUT_CLS}
        />
      </div>

      <div>
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className={`border-2 border-dashed rounded-xl bg-white px-6 py-10 flex flex-col items-center gap-3 cursor-pointer transition-colors ${dragging ? 'border-[#3B3EFF] bg-blue-50' : 'border-[#3B3EFF]/50'}`}
        >
          <div className="w-14 h-14 rounded-2xl bg-[#EBEBFF] flex items-center justify-center">
            <svg width="30" height="30" fill="none" viewBox="0 0 24 24">
              <path d="M12 15V4M12 4L8.5 7.5M12 4L15.5 7.5" stroke="#3B3EFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 17v1.75C4 19.993 4.895 21 6 21h12c1.105 0 2-1.007 2-2.25V17" stroke="#3B3EFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-[15px] font-bold text-zinc-800">음성 파일 업로드</p>
          <p className="text-[13px] text-zinc-400 text-center leading-relaxed">
            탭하여 파일을 선택하거나 여기로 끌어다 놓으세요
          </p>
          <input ref={inputRef} type="file" accept="audio/*" multiple className="hidden"
            onChange={(e) => addFiles(e.target.files)} />
        </div>

        {files.length > 0 && (
          <div className="flex flex-col gap-2 mt-3">
            {files.map(({ file, duration }, idx) => (
              <div key={idx} className="relative bg-white rounded-xl px-4 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EBEBFF] flex items-center justify-center shrink-0">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#3B3EFF" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-zinc-800 truncate">{file.name}</p>
                  <p className="text-[12px] text-zinc-400 mt-0.5">{formatSize(file.size)}{duration ? ` · ${duration}` : ''}</p>
                </div>
                <button onClick={() => removeFile(idx)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-400 text-white rounded-full flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        disabled={files.length === 0}
        onClick={startGenerating}
        className="mx-1 bg-[#3B3EFF] disabled:bg-zinc-300 text-white text-[15px] font-semibold py-3.5 rounded-xl transition-colors"
      >
        AI 요약 생성
      </button>
    </div>
  );
}
