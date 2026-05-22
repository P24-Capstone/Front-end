'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

// ─── 타입 정의 ───────────────────────────────────────────────
type RecordingState = 'idle' | 'recording' | 'paused' | 'uploading' | 'done' | 'error';
type UploadStep = 0 | 1 | 2 | 3; // 0=대기, 1=S3저장중, 2=AI전송중, 3=완료

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
  const searchParams = useSearchParams();            // ✅ 추가
  const teamId = params?.id ?? '';
  const mode = searchParams.get('mode');             // 'record' | 'upload'

  // 상태
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [seconds, setSeconds] = useState(0);
  const [barHeights, setBarHeights] = useState<number[]>(Array(NUM_BARS).fill(6));
  const [showStopPopup, setShowStopPopup] = useState(false);
  const [uploadStep, setUploadStep] = useState<UploadStep>(0);
  const [errorMsg, setErrorMsg] = useState('');

  // refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── 공통 업로드 함수 (녹음 Blob / 업로드 File 모두 처리) ──────
  // ✅ handleConfirmStop과 mode=upload 양쪽에서 재사용
  const uploadAudio = useCallback(
    async (blob: Blob, filename: string) => {
      setRecordingState('uploading');
      setUploadStep(0);

      try {
        // Step 1: Spring 서버로 전송 (서버가 S3 저장 + AI 서버 호출)
        setUploadStep(1);

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

        // Step 2: 서버에서 Whisper + GPT 처리 완료 대기
        setUploadStep(2);
        const result = await res.json();

        // Step 3: 완료
        setUploadStep(3);
        setRecordingState('done');

        // 2초 후 회의록 상세 페이지로 이동
        setTimeout(() => {
          router.push(`/${teamId}/minutes/${result.data?.meetingId}`);
        }, 2000);
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
  // ✅ useEffect 하나로 통합 — 중복 실행 버그 제거
  useEffect(() => {
    if (mode === 'upload') {
      // new/page.tsx에서 window.__uploadedAudio 에 저장한 File 꺼내기
      const file = (window as Window & { __uploadedAudio?: File }).__uploadedAudio;
      if (!file) {
        // 파일이 없으면 선택 페이지로 돌려보냄
        router.replace(`/${teamId}/minutes/new`);
        return;
      }
      // 파일을 바로 업로드 (녹음 없이)
      uploadAudio(file, file.name);
    } else {
      // mode === 'record' 또는 직접 접근
      startRecording();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveRef.current) clearInterval(waveRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [mode]); // ✅ mode만 의존 — startRecording/uploadAudio는 useCallback으로 안정화됨

  // ── 타이머 ────────────────────────────────────────────────
  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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
    return () => {
      if (waveRef.current) clearInterval(waveRef.current);
    };
  }, [recordingState]);

  // ── 일시정지 / 재개 ────────────────────────────────────────
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

  // ── 중지 버튼 (팝업만 열기, 녹음 계속) ─────────────────────
  const handleStopClick = () => setShowStopPopup(true);

  // ── 팝업 취소 ─────────────────────────────────────────────
  const handleCancelStop = () => setShowStopPopup(false);

  // ── 팝업 확인 → 실제 중지 + 업로드 ────────────────────────
  const handleConfirmStop = async () => {
    setShowStopPopup(false);

    // MediaRecorder 정지 후 Blob 수집 완료 대기
    const blob = await new Promise<Blob>((resolve) => {
      const recorder = mediaRecorderRef.current!;
      recorder.onstop = () => {
        resolve(new Blob(chunksRef.current, { type: recorder.mimeType }));
      };
      recorder.stop();
    });

    // 스트림 종료
    streamRef.current?.getTracks().forEach((t) => t.stop());

    // ✅ 공통 업로드 함수 호출
    await uploadAudio(blob, 'recording.webm');
  };

  // ── 뒤로 가기 ─────────────────────────────────────────────
  const handleBack = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    router.push(`/${teamId}/minutes`);
  };

  // ─── 렌더링 ────────────────────────────────────────────────
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
                recordingState === 'recording'
                  ? '#E24B4A'
                  : recordingState === 'done'
                  ? '#1D9E75'
                  : recordingState === 'error'
                  ? '#E24B4A'
                  : '#888780',
              animation:
                recordingState === 'recording' ? 'pulseDot 1.2s ease-in-out infinite' : 'none',
            }}
          />
          <span style={styles.statusLabel}>
            {recordingState === 'idle' && '준비 중'}
            {recordingState === 'recording' && '녹음 중'}
            {recordingState === 'paused' && '일시정지'}
            {recordingState === 'uploading' && '처리 중'}
            {recordingState === 'done' && '완료'}
            {recordingState === 'error' && '오류 발생'}
          </span>
          {/* 파일 업로드 모드일 때 파일명 표시 */}
          <span style={styles.fileLabel}>
            {mode === 'upload'
              ? ((window as Window & { __uploadedAudio?: File }).__uploadedAudio?.name ?? '')
              : 'recording.webm'}
          </span>
        </div>

        {/* 타이머 — 파일 업로드 모드에서는 숨김 */}
        {mode !== 'upload' && (
          <div
            style={styles.timer}
            aria-live="polite"
            aria-label={`경과 시간 ${formatTime(seconds)}`}
          >
            {formatTime(seconds)}
          </div>
        )}

        {/* 파형 — 녹음 모드에서만 표시 */}
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

        {/* 버튼 — 녹음 중 / 일시정지 상태에서만 표시 */}
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
            <p style={{ margin: '8px 0 4px', fontWeight: 500 }}>회의록이 생성되었습니다!</p>
            <p style={{ fontSize: 13, color: '#888780' }}>잠시 후 상세 페이지로 이동합니다...</p>
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

      {/* 중지 확인 팝업 */}
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

// ─── 업로드 진행 컴포넌트 ─────────────────────────────────────
function UploadProgress({ step }: { step: UploadStep }) {
  const steps = [
    { label: 'S3에 파일 저장 중...', icon: '☁️' },
    { label: 'AI 서버에서 분석 중 (Whisper + GPT)...', icon: '🤖' },
    { label: '회의록 생성 완료', icon: '📝' },
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

// ─── 중지 확인 팝업 컴포넌트 ──────────────────────────────────
function StopConfirmPopup({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="stop-popup-title"
    >
      <div style={styles.popup}>
        <p id="stop-popup-title" style={styles.popupTitle}>
          녹음을 종료하시겠습니까?
        </p>
        <p style={styles.popupDesc}>
          녹음을 중지하고 파일을 저장합니다.
          <br />
          이 작업은 취소할 수 없습니다.
        </p>
        <div style={styles.popupBtns}>
          <button style={styles.popupCancel} onClick={onCancel}>
            취소
          </button>
          <button style={styles.popupConfirm} onClick={onConfirm}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 스타일 ───────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#F1EFE8',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 16px 40px',
    fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
  },
  header: {
    width: '100%',
    maxWidth: 520,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 0 16px',
  },
  headerTitle: { fontSize: 17, fontWeight: 500, color: '#2C2C2A' },
  backBtn: {
    background: 'none',
    border: 'none',
    fontSize: 14,
    color: '#5F5E5A',
    cursor: 'pointer',
    padding: '4px 0',
    width: 80,
    textAlign: 'left',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    background: '#FFFFFF',
    border: '0.5px solid rgba(0,0,0,0.1)',
    borderRadius: 16,
    padding: '28px 24px',
  },
  statusRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 },
  dot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  statusLabel: { fontSize: 14, fontWeight: 500, color: '#444441', flex: 1 },
  fileLabel: { fontSize: 12, color: '#888780', fontFamily: 'monospace' },
  timer: {
    fontSize: 48,
    fontWeight: 500,
    letterSpacing: 3,
    textAlign: 'center',
    color: '#2C2C2A',
    fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace",
    marginBottom: 24,
  },
  waveform: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    height: 64,
    marginBottom: 28,
  },
  bar: { width: 4, borderRadius: 2, flexShrink: 0 },
  btnRow: { display: 'flex', gap: 12, justifyContent: 'center' },
  btnSecondary: {
    padding: '10px 24px',
    borderRadius: 8,
    border: '0.5px solid rgba(0,0,0,0.2)',
    background: '#FFFFFF',
    color: '#2C2C2A',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnDanger: {
    padding: '10px 24px',
    borderRadius: 8,
    border: '0.5px solid #E24B4A',
    background: '#FFFFFF',
    color: '#E24B4A',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  doneMsg: { textAlign: 'center', padding: '8px 0', color: '#2C2C2A' },
  errorMsg: { textAlign: 'center', padding: '8px 0' },
  popup: {
    background: '#FFFFFF',
    borderRadius: 16,
    border: '0.5px solid rgba(0,0,0,0.1)',
    padding: '28px 24px 20px',
    width: 300,
    textAlign: 'center',
  },
  popupTitle: { fontSize: 16, fontWeight: 500, color: '#2C2C2A', margin: '0 0 10px' },
  popupDesc: { fontSize: 13, color: '#888780', lineHeight: 1.7, margin: '0 0 20px' },
  popupBtns: { display: 'flex', gap: 8 },
  popupCancel: {
    flex: 1,
    padding: '10px',
    borderRadius: 8,
    border: '0.5px solid rgba(0,0,0,0.15)',
    background: '#FFFFFF',
    color: '#444441',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  popupConfirm: {
    flex: 1,
    padding: '10px',
    borderRadius: 8,
    border: 'none',
    background: '#E24B4A',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
};