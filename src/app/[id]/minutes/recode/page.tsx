'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

// ─── 타입 정의 ───────────────────────────────────────────────
type RecordingState = 'idle' | 'recording' | 'paused' | 'uploading' | 'done' | 'error';
type UploadStep = 0 | 1 | 2; // 0=대기, 1=업로드 중, 2=완료

// ─── 상수 ────────────────────────────────────────────────────
const NUM_BARS = 40;
const SPRING_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

// ─── 유틸 ────────────────────────────────────────────────────
function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────
export default function RecordPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const teamId = params?.id ?? '';
  const mode = searchParams.get('mode'); // 'record' | 'upload'

  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [seconds, setSeconds] = useState(0);
  const [barHeights, setBarHeights] = useState<number[]>(Array(NUM_BARS).fill(6));
  const [showStopPopup, setShowStopPopup] = useState(false);
  const [uploadStep, setUploadStep] = useState<UploadStep>(0);
  const [errorMsg, setErrorMsg] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── 공통 업로드 함수 ──────────────────────────────────────
  // API가 즉시 status='P' 로 응답하므로 단계가 2개로 단순화됨
  const uploadAudio = useCallback(
    async (blob: Blob, filename: string) => {
      setRecordingState('uploading');
      setUploadStep(0);

      try {
        setUploadStep(1); // 서버에 업로드 중

        const formData = new FormData();
        formData.append('audio', blob, filename);
        formData.append('teamId', teamId);

        const token =
          typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

        const res = await fetch(`${SPRING_API_URL}/api/meeting-records`, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message ?? '서버 오류가 발생했습니다.');
        }

        const result = await res.json();

        // 업로드 완료 — AI 처리는 백그라운드에서 진행
        setUploadStep(2);
        setRecordingState('done');

        // 1.5초 후 상세 페이지로 이동 (상세 페이지에서 처리 중 상태 표시)
        setTimeout(() => {
          router.push(`/${teamId}/minutes/${result.data?.meetingId}`);
        }, 1500);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        setErrorMsg(msg);
        setRecordingState('error');
      }
    },
    [teamId, router],
  );

  // ── 녹음 시작 ─────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setRecordingState('recording');
    } catch {
      setErrorMsg('마이크 접근 권한이 없습니다. 브라우저 설정에서 허용해 주세요.');
      setRecordingState('error');
    }
  }, []);

  // ── 페이지 진입 시 mode에 따라 분기 ─────────────────────────
  useEffect(() => {
    if (mode === 'upload') {
      const file = (window as Window & { __uploadedAudio?: File }).__uploadedAudio;
      if (!file) {
        router.replace(`/${teamId}/minutes/new`);
        return;
      }
      uploadAudio(file, file.name);
    } else {
      startRecording();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveRef.current) clearInterval(waveRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 타이머 ────────────────────────────────────────────────
  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recordingState]);

  // ── 파형 애니메이션 ────────────────────────────────────────
  useEffect(() => {
    if (recordingState === 'recording') {
      waveRef.current = setInterval(() => {
        setBarHeights(
          Array.from({ length: NUM_BARS }, (_, i) => {
            const center = NUM_BARS / 2;
            const dist = Math.abs(i - center) / center;
            const max = 52 * (1 - dist * 0.4);
            return Math.max(4, Math.random() * max + 4);
          }),
        );
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

  const handleStopClick = () => setShowStopPopup(true);
  const handleCancelStop = () => setShowStopPopup(false);

  const handleConfirmStop = async () => {
    setShowStopPopup(false);
    const blob = await new Promise<Blob>((resolve) => {
      const recorder = mediaRecorderRef.current!;
      recorder.onstop = () => {
        resolve(new Blob(chunksRef.current, { type: recorder.mimeType }));
      };
      recorder.stop();
    });
    streamRef.current?.getTracks().forEach((t) => t.stop());
    await uploadAudio(blob, 'recording.webm');
  };

  const handleBack = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    router.push(`/${teamId}/minutes`);
  };

  return (
    <div style={styles.page}>
      {/* 헤더 */}
      <div style={styles.header}>
        <button
          style={styles.backBtn}
          onClick={handleBack}
          disabled={recordingState === 'uploading'}
          aria-label="회의록 목록으로 돌아가기"
        >
          ← 돌아가기
        </button>
        <span style={styles.headerTitle}>새 회의록</span>
        <span style={{ width: 80 }} />
      </div>

      {/* 메인 카드 */}
      <div style={styles.card}>
        {/* 상태 뱃지 */}
        <div style={styles.statusRow}>
          <span
            style={{
              ...styles.dot,
              background:
                recordingState === 'recording' ? '#E24B4A'
                : recordingState === 'done'      ? '#1D9E75'
                : recordingState === 'error'     ? '#E24B4A'
                : '#888780',
              animation:
                recordingState === 'recording' ? 'pulseDot 1.2s ease-in-out infinite' : 'none',
            }}
          />
          <span style={styles.statusLabel}>
            {recordingState === 'idle'      && '준비 중'}
            {recordingState === 'recording' && '녹음 중'}
            {recordingState === 'paused'    && '일시정지'}
            {recordingState === 'uploading' && '업로드 중'}
            {recordingState === 'done'      && '업로드 완료'}
            {recordingState === 'error'     && '오류 발생'}
          </span>
          <span style={styles.fileLabel}>
            {mode === 'upload'
              ? ((window as Window & { __uploadedAudio?: File }).__uploadedAudio?.name ?? '')
              : 'recording.webm'}
          </span>
        </div>

        {/* 타이머 — 녹음 모드에서만 표시 */}
        {mode !== 'upload' && (
          <div style={styles.timer} aria-live="polite">
            {formatTime(seconds)}
          </div>
        )}

        {/* 파형 — 녹음 중에만 표시 */}
        {mode !== 'upload' && (
          <div style={styles.waveform} aria-hidden="true">
            {barHeights.map((h, i) => (
              <div
                key={i}
                style={{
                  ...styles.bar,
                  height: `${Math.round(h)}px`,
                  background:
                    recordingState === 'recording'
                      ? `hsl(${1 + i * 3}, 72%, ${52 + (h / 60) * 12}%)`
                      : '#D3D1C7',
                  transition:
                    recordingState === 'recording' ? 'height 0.09s ease' : 'height 0.3s ease',
                }}
              />
            ))}
          </div>
        )}

        {/* 녹음 조작 버튼 */}
        {(recordingState === 'recording' || recordingState === 'paused') && (
          <div style={styles.btnRow}>
            <button style={styles.btnSecondary} onClick={handlePauseResume}>
              {recordingState === 'paused' ? '▶ 재개' : '⏸ 일시정지'}
            </button>
            <button style={styles.btnDanger} onClick={handleStopClick}>
              ⏹ 중지
            </button>
          </div>
        )}

        {/* 업로드 진행 상태 */}
        {recordingState === 'uploading' && <UploadProgress step={uploadStep} />}

        {/* 완료 */}
        {recordingState === 'done' && (
          <div style={styles.doneMsg}>
            <span style={{ fontSize: 28 }}>✅</span>
            <p style={{ margin: '8px 0 4px', fontWeight: 500 }}>업로드 완료!</p>
            <p style={{ fontSize: 13, color: '#888780' }}>
              AI가 회의록을 분석하고 있어요.
              <br />잠시 후 상세 페이지로 이동합니다...
            </p>
          </div>
        )}

        {/* 에러 */}
        {recordingState === 'error' && (
          <div style={styles.errorMsg}>
            <p style={{ margin: '0 0 12px', fontWeight: 500, color: '#E24B4A' }}>{errorMsg}</p>
            <button style={styles.btnSecondary} onClick={handleBack}>
              목록으로 돌아가기
            </button>
          </div>
        )}
      </div>

      {showStopPopup && (
        <StopConfirmPopup onCancel={handleCancelStop} onConfirm={handleConfirmStop} />
      )}

      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.85); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── 업로드 진행 컴포넌트 (2단계로 단순화) ───────────────────
function UploadProgress({ step }: { step: UploadStep }) {
  const steps = [
    { label: '서버에 파일 업로드 중...', icon: '☁️' },
    { label: 'AI 분석 요청 완료 (백그라운드 처리 중)', icon: '🤖' },
  ];

  return (
    <div style={{ textAlign: 'center', paddingTop: 8 }}>
      <div
        style={{
          width: 36,
          height: 36,
          border: '3px solid #D3D1C7',
          borderTopColor: '#378ADD',
          borderRadius: '50%',
          margin: '0 auto 20px',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
        {steps.map((s, i) => {
          const isDone = step > i + 1;
          const isActive = step === i + 1;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 14,
                color: isDone ? '#1D9E75' : isActive ? '#378ADD' : '#B4B2A9',
                fontWeight: isActive ? 500 : 400,
                transition: 'color 0.3s',
              }}
            >
              <span style={{ fontSize: 16 }}>{isDone ? '✅' : s.icon}</span>
              {s.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 중지 확인 팝업 ───────────────────────────────────────────
function StopConfirmPopup({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="stop-popup-title"
    >
      <div style={styles.popup}>
        <p id="stop-popup-title" style={styles.popupTitle}>녹음을 종료하시겠습니까?</p>
        <p style={styles.popupDesc}>
          녹음을 중지하고 파일을 저장합니다.<br />이 작업은 취소할 수 없습니다.
        </p>
        <div style={styles.popupBtns}>
          <button style={styles.popupCancel} onClick={onCancel}>취소</button>
          <button style={styles.popupConfirm} onClick={onConfirm}>확인</button>
        </div>
      </div>
    </div>
  );
}

// ─── 스타일 ───────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', background: '#F1EFE8', display: 'flex',
    flexDirection: 'column', alignItems: 'center', padding: '0 16px 40px',
    fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
  },
  header: {
    width: '100%', maxWidth: 520, display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '20px 0 16px',
  },
  headerTitle: { fontSize: 17, fontWeight: 500, color: '#2C2C2A' },
  backBtn: {
    background: 'none', border: 'none', fontSize: 14, color: '#5F5E5A',
    cursor: 'pointer', padding: '4px 0', width: 80, textAlign: 'left',
  },
  card: {
    width: '100%', maxWidth: 520, background: '#FFFFFF',
    border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 16, padding: '28px 24px',
  },
  statusRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 },
  dot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  statusLabel: { fontSize: 14, fontWeight: 500, color: '#444441', flex: 1 },
  fileLabel: { fontSize: 12, color: '#888780', fontFamily: 'monospace' },
  timer: {
    fontSize: 48, fontWeight: 500, letterSpacing: 3, textAlign: 'center', color: '#2C2C2A',
    fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace", marginBottom: 24,
  },
  waveform: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 2, height: 64, marginBottom: 28,
  },
  bar: { width: 4, borderRadius: 2, flexShrink: 0 },
  btnRow: { display: 'flex', gap: 12, justifyContent: 'center' },
  btnSecondary: {
    padding: '10px 24px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.2)',
    background: '#FFFFFF', color: '#2C2C2A', fontSize: 14, fontWeight: 500, cursor: 'pointer',
  },
  btnDanger: {
    padding: '10px 24px', borderRadius: 8, border: '0.5px solid #E24B4A',
    background: '#FFFFFF', color: '#E24B4A', fontSize: 14, fontWeight: 500, cursor: 'pointer',
  },
  doneMsg: { textAlign: 'center', padding: '8px 0', color: '#2C2C2A' },
  errorMsg: { textAlign: 'center', padding: '8px 0' },
  popup: {
    background: '#FFFFFF', borderRadius: 16, border: '0.5px solid rgba(0,0,0,0.1)',
    padding: '28px 24px 20px', width: 300, textAlign: 'center',
  },
  popupTitle: { fontSize: 16, fontWeight: 500, color: '#2C2C2A', margin: '0 0 10px' },
  popupDesc: { fontSize: 13, color: '#888780', lineHeight: 1.7, margin: '0 0 20px' },
  popupBtns: { display: 'flex', gap: 8 },
  popupCancel: {
    flex: 1, padding: '10px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.15)',
    background: '#FFFFFF', color: '#444441', fontSize: 14, fontWeight: 500, cursor: 'pointer',
  },
  popupConfirm: {
    flex: 1, padding: '10px', borderRadius: 8, border: 'none',
    background: '#E24B4A', color: '#FFFFFF', fontSize: 14, fontWeight: 500, cursor: 'pointer',
  },
};
