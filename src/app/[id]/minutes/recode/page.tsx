'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useHeaderSlotStore } from '@/store/headerSlot';
import api from '@/lib/api';

type RecordingState = 'idle' | 'recording' | 'paused' | 'uploading' | 'done' | 'error';

const NUM_BARS = 40;

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function RecordPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const teamId = params?.id ?? '';
  const mode = searchParams.get('mode');

  const { setPageHeader } = useHeaderSlotStore();

  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [seconds, setSeconds] = useState(0);
  const [barHeights, setBarHeights] = useState<number[]>(Array(NUM_BARS).fill(6));
  const [showStopModal, setShowStopModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const isActive = recordingState === 'recording' || recordingState === 'paused';
    setPageHeader({
      title: mode === 'upload' ? '파일 업로드' : '녹음 중',
      hideHamburger: true,
      onBack: isActive
        ? () => setShowLeaveModal(true)
        : undefined,
    });
  }, [setPageHeader, mode, recordingState]);

  useEffect(() => {
    return () => setPageHeader(null);
  }, [setPageHeader]);

  const uploadAudio = useCallback(async (blob: Blob, filename: string) => {
    setRecordingState('uploading');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setErrorMsg('로그인이 필요합니다. 다시 로그인해 주세요.');
        setRecordingState('error');
        return;
      }
      const formData = new FormData();
      formData.append('audio', blob, filename);
      formData.append('teamId', teamId);
      const { data: result } = await api.post('/api/meeting-records', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecordingState('done');
      setTimeout(() => {
        router.push(`/${teamId}/minutes/${result.data?.meetingId}`);
      }, 1500);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg =
        status === 403
          ? '인증이 만료되었습니다. 다시 로그인해 주세요.'
          : ((err as { response?: { data?: { message?: string } } })?.response?.data?.message
            ?? (err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'));
      setErrorMsg(msg);
      setRecordingState('error');
    }
  }, [teamId, router]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setRecordingState('recording');
    } catch {
      setErrorMsg('마이크 접근 권한이 없습니다. 브라우저 설정에서 허용해 주세요.');
      setRecordingState('error');
    }
  }, []);

  useEffect(() => {
    if (mode === 'upload') {
      const file = (window as Window & { __uploadedAudio?: File }).__uploadedAudio;
      if (!file) { router.replace(`/${teamId}/minutes/new`); return; }
      uploadAudio(file, file.name);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveRef.current) clearInterval(waveRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recordingState]);

  useEffect(() => {
    if (recordingState === 'recording') {
      waveRef.current = setInterval(() => {
        setBarHeights(Array.from({ length: NUM_BARS }, (_, i) => {
          const center = NUM_BARS / 2;
          const dist = Math.abs(i - center) / center;
          const max = 52 * (1 - dist * 0.4);
          return Math.max(4, Math.random() * max + 4);
        }));
      }, 90);
    } else {
      if (waveRef.current) clearInterval(waveRef.current);
      setBarHeights(Array(NUM_BARS).fill(6));
    }
    return () => { if (waveRef.current) clearInterval(waveRef.current); };
  }, [recordingState]);

  const handlePauseResume = () => {
    if (!mediaRecorderRef.current) return;
    if (recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
    } else {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
    }
  };

  const handleConfirmStop = async () => {
    setShowStopModal(false);
    const blob = await new Promise<Blob>((resolve) => {
      const recorder = mediaRecorderRef.current!;
      recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: recorder.mimeType }));
      recorder.stop();
    });
    streamRef.current?.getTracks().forEach((t) => t.stop());
    await uploadAudio(blob, 'recording.webm');
  };

  const statusColor =
    recordingState === 'recording' ? 'bg-red-500' :
    recordingState === 'done'      ? 'bg-emerald-500' :
    recordingState === 'error'     ? 'bg-red-500' : 'bg-zinc-400';

  const statusLabel =
    recordingState === 'idle'      ? '준비 중' :
    recordingState === 'recording' ? '녹음 중' :
    recordingState === 'paused'    ? '일시정지' :
    recordingState === 'uploading' ? '업로드 중' :
    recordingState === 'done'      ? '업로드 완료' : '오류 발생';

  const fileName = mode === 'upload'
    ? ((window as Window & { __uploadedAudio?: File }).__uploadedAudio?.name ?? '')
    : 'recording.webm';

  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-6 pb-10 flex flex-col gap-4">

      {/* 메인 카드 */}
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-6 shadow-sm">

        {/* 상태 뱃지 */}
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusColor} ${recordingState === 'recording' ? 'animate-pulse' : ''}`} />
          <span className="text-[14px] font-semibold text-zinc-800 flex-1">{statusLabel}</span>
          {fileName && (
            <span className="text-[11px] text-zinc-400 font-mono truncate max-w-[140px]">{fileName}</span>
          )}
        </div>

        {/* 타이머 */}
        {mode !== 'upload' && (
          <div className="text-center">
            <span className="text-[52px] font-medium tracking-widest text-zinc-900 font-mono tabular-nums">
              {formatTime(seconds)}
            </span>
          </div>
        )}

        {/* 파형 */}
        {mode !== 'upload' && (
          <div className="flex items-center justify-center gap-[3px] h-16" aria-hidden="true">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-full shrink-0 transition-all"
                style={{
                  height: `${Math.round(h)}px`,
                  backgroundColor: recordingState === 'recording'
                    ? `hsl(239, 90%, ${52 + (h / 60) * 15}%)`
                    : '#d4d4d8',
                  transitionDuration: recordingState === 'recording' ? '90ms' : '300ms',
                }}
              />
            ))}
          </div>
        )}

        {/* 녹음 시작 버튼 (idle) */}
        {recordingState === 'idle' && mode !== 'upload' && (
          <div className="flex flex-col items-center gap-4 py-2">
            <button
              onClick={startRecording}
              className="w-14 h-14 rounded-full bg-[#3B3EFF] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="white" strokeWidth={1.8} />
              </svg>
            </button>
            <p className="text-[13px] text-zinc-400">버튼을 눌러 녹음을 시작하세요</p>
          </div>
        )}

        {/* 녹음 조작 버튼 */}
        {(recordingState === 'recording' || recordingState === 'paused') && (
          <div className="flex gap-3">
            <button
              onClick={handlePauseResume}
              className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-zinc-600 bg-zinc-100 flex items-center justify-center gap-1.5"
            >
              {recordingState === 'paused' ? (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>재개</>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>일시정지</>
              )}
            </button>
            <button
              onClick={() => setShowStopModal(true)}
              className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-red-500 border border-red-200 bg-white flex items-center justify-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
              중지
            </button>
          </div>
        )}

        {/* 업로드 중 */}
        {recordingState === 'uploading' && (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="w-9 h-9 border-[3px] border-zinc-200 border-t-[#3B3EFF] rounded-full animate-spin" />
            <p className="text-[14px] text-zinc-500">서버에 파일 업로드 중...</p>
          </div>
        )}

        {/* 완료 */}
        {recordingState === 'done' && (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-zinc-900">업로드 완료!</p>
            <p className="text-[13px] text-zinc-400 text-center leading-relaxed">
              AI가 회의록을 분석하고 있어요.<br />잠시 후 상세 페이지로 이동합니다...
            </p>
          </div>
        )}

        {/* 에러 */}
        {recordingState === 'error' && (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            </div>
            <p className="text-[14px] font-medium text-red-500 text-center">{errorMsg}</p>
            <button
              onClick={() => { streamRef.current?.getTracks().forEach((t) => t.stop()); router.push(`/${teamId}/minutes`); }}
              className="w-full py-3 rounded-xl text-[14px] font-semibold bg-zinc-100 text-zinc-600"
            >
              목록으로 돌아가기
            </button>
          </div>
        )}
      </div>

      {/* 나가기 확인 모달 */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-[300px] p-6 shadow-xl">
            <h3 className="text-[16px] font-bold text-zinc-900 text-center mb-2">녹음을 중단할까요?</h3>
            <p className="text-[13px] text-zinc-500 text-center mb-6 leading-relaxed">
              지금 나가면 녹음 기록이 사라집니다.<br />정말 나가시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-medium text-zinc-600 border border-zinc-200"
              >
                취소
              </button>
              <button
                onClick={() => {
                  streamRef.current?.getTracks().forEach((t) => t.stop());
                  router.push(`/${teamId}/minutes`);
                }}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-red-500"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 중지 확인 모달 */}
      {showStopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-[300px] p-6 shadow-xl">
            <h3 className="text-[16px] font-bold text-zinc-900 text-center mb-2">녹음을 종료할까요?</h3>
            <p className="text-[13px] text-zinc-500 text-center mb-6 leading-relaxed">
              녹음을 중지하고 파일을 저장합니다.<br />이 작업은 취소할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStopModal(false)}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-medium text-zinc-600 border border-zinc-200"
              >
                취소
              </button>
              <button
                onClick={handleConfirmStop}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-[#3B3EFF]"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}