'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

type TabType = '요약' | '스크립트' | '정보';

interface MeetingRecordResponse {
  meetingId: number;
  teamId: string;
  recFileKey: string;
  status: string;           // P(처리중) | C(완료) | F(실패)
  meetingTitle: string | null;
  fullScript: string | null;
  aiSummary: string | null;
  meetingRegDtm: string;
}

interface MemberResponse {
  memRole: string;
  memState: string;
}

// ── AI 처리 중 배너 ──────────────────────────────────────────────
function ProcessingBanner() {
  return (
    <div className="mb-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 flex items-center gap-3">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
      <div>
        <p className="text-[13px] font-semibold text-amber-700">AI가 회의록을 분석하고 있어요</p>
        <p className="text-[12px] text-amber-500 mt-0.5">완료되면 자동으로 업데이트됩니다.</p>
      </div>
    </div>
  );
}

// ── 실패 배너 ────────────────────────────────────────────────────
function FailedBanner({ onRetry, isRetrying }: { onRetry: () => void; isRetrying: boolean }) {
  return (
    <div className="mb-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-start gap-3">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2} className="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4M12 16h.01" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-red-600">AI 분석에 실패했습니다</p>
        <p className="text-[12px] text-red-400 mt-0.5">음성 파일을 확인한 후 다시 시도해 주세요.</p>
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-white bg-red-400 hover:bg-red-500 disabled:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          {isRetrying ? (
            <><span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />재시도 중...</>
          ) : (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>AI 분석 재시도</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── 원본 음성 플레이어 ────────────────────────────────────────────
function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying]   = useState(false);
  const [current, setCurrent]   = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); } else { el.play(); }
    setPlaying(!playing);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="bg-white rounded-xl p-4">
      <p className="text-[13px] font-semibold text-zinc-700 mb-3">원본 음성</p>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
      <div className="flex items-center gap-3">
        {/* 재생/일시정지 버튼 */}
        <button
          onClick={toggle}
          className="w-10 h-10 rounded-full bg-[#3B3EFF] flex items-center justify-center shrink-0 active:scale-95 transition-transform"
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        {/* 진행 바 */}
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={current}
            step={0.1}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCurrent(val);
              if (audioRef.current) audioRef.current.currentTime = val;
            }}
            className="w-full h-1.5 rounded-full accent-[#3B3EFF] cursor-pointer"
            style={{ background: `linear-gradient(to right, #3B3EFF ${pct}%, #e4e4e7 ${pct}%)` }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-zinc-400 font-mono">{fmt(current)}</span>
            <span className="text-[10px] text-zinc-400 font-mono">{duration ? fmt(duration) : '--:--'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────────
export default function MinuteDetailPage() {
  const { id, minuteId } = useParams<{ id: string; minuteId: string }>();
  const router      = useRouter();
  const queryClient = useQueryClient();

  const [tab,               setTab]               = useState<TabType>('요약');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* 수정 모드 */
  const [isEditing,   setIsEditing]   = useState(false);
  const [editTitle,   setEditTitle]   = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editScript,  setEditScript]  = useState('');

  /* ── 쿼리 ── */
  const { data: myMembership } = useQuery({
    queryKey: ['members', 'me', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/me?teamId=${id}`);
      return data.data as MemberResponse;
    },
    enabled: !!id,
  });
  const isLeader = myMembership?.memRole === 'L' && myMembership?.memState === 'A';

  const { data: record, isLoading, isError } = useQuery({
    queryKey: ['meeting-record', minuteId],
    queryFn: async () => {
      const { data } = await api.get(`/api/meeting-records/${minuteId}`);
      return data.data as MeetingRecordResponse;
    },
    enabled: !!minuteId,
  });

  /* status='P' 폴링 */
  useEffect(() => {
    if (record?.status !== 'P') return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['meeting-record', minuteId] });
    }, 5000);
    return () => clearInterval(interval);
  }, [record?.status, minuteId, queryClient]);

  /* ── Mutations ── */
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/meeting-records/${minuteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-records', id] });
      router.back();
    },
    onError: () => alert('삭제에 실패했습니다.'),
  });

  const retryMutation = useMutation({
    mutationFn: () => api.post(`/api/meeting-records/${minuteId}/retry`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-record', minuteId] });
      queryClient.invalidateQueries({ queryKey: ['meeting-records', id] });
    },
    onError: () => alert('재시도에 실패했습니다. 잠시 후 다시 시도해 주세요.'),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      api.patch(`/api/meeting-records/${minuteId}`, {
        meetingTitle: editTitle.trim(),
        aiSummary:    editSummary.trim(),
        fullScript:   editScript.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-record', minuteId] });
      queryClient.invalidateQueries({ queryKey: ['meeting-records', id] });
      setIsEditing(false);
    },
    onError: () => alert('수정에 실패했습니다. 다시 시도해 주세요.'),
  });

  /* 수정 모드 진입 */
  const startEdit = () => {
    setEditTitle(record?.meetingTitle ?? '');
    setEditSummary(record?.aiSummary ?? '');
    setEditScript(record?.fullScript ?? '');
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  /* ── 로딩/에러 ── */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[14px] text-zinc-400">불러오는 중...</p>
      </div>
    );
  }
  if (isError || !record) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-[14px] text-zinc-400">회의록을 찾을 수 없습니다.</p>
        <button onClick={() => router.back()} className="text-[13px] text-[#3B3EFF]">돌아가기</button>
      </div>
    );
  }

  const isProcessing = record.status === 'P';
  const isFailed     = record.status === 'F';
  const isDone       = record.status === 'C';

  return (
    <div className="flex flex-col min-h-full">

      {/* ── 삭제 확인 모달 ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-[300px] p-6 shadow-xl">
            <h3 className="text-[16px] font-bold text-zinc-900 text-center mb-2">회의록 삭제</h3>
            <p className="text-[13px] text-zinc-500 text-center mb-6">이 회의록을 삭제하시겠습니까?<br />삭제된 데이터는 복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-medium text-zinc-600 border border-zinc-200"
              >취소</button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-red-500 disabled:opacity-60"
              >{deleteMutation.isPending ? '삭제 중...' : '삭제'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 제목 · 날짜 · 액션 버튼 ── */}
      <div className="pt-5 pb-4">
        {isEditing ? (
          /* 수정 모드: 제목 입력 */
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="회의록 제목"
            className="w-full text-[17px] font-bold text-zinc-900 border-b-2 border-[#3B3EFF] outline-none bg-transparent pb-1 mb-3"
          />
        ) : (
          <h1 className="text-[17px] font-bold text-zinc-900 leading-snug mb-3">
            {record.meetingTitle || '제목 없음'}
          </h1>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span className="text-[12px] text-zinc-400">{record.meetingRegDtm?.slice(0, 10)}</span>
          </div>

          {/* 수정 / 삭제 버튼 */}
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={cancelEdit}
                className="text-[12px] font-medium text-zinc-400 px-3 py-1.5 rounded-lg border border-zinc-200"
              >취소</button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !editTitle.trim()}
                className="text-[12px] font-semibold text-white bg-[#3B3EFF] px-3 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1"
              >
                {saveMutation.isPending ? (
                  <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />저장 중</>
                ) : '저장'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {/* 수정 버튼 — 완료 상태에서만 활성 */}
              <button
                onClick={startEdit}
                disabled={!isDone}
                title={isDone ? '회의록 수정' : '완료된 회의록만 수정할 수 있습니다'}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 transition-colors"
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                수정
              </button>
              {/* 삭제 버튼 — 리더만 */}
              {isLeader && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-red-400 hover:bg-red-50 transition-colors"
                >
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                  </svg>
                  삭제
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 탭바 ── */}
      <div className="flex border-t border-b border-zinc-200 -mx-4 sticky top-0 z-10 bg-white">
        {(['요약', '스크립트', '정보'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex justify-center text-[13px] font-medium transition-colors ${tab === t ? 'text-zinc-900' : 'text-zinc-400'}`}
          >
            <span className={`inline-block py-2.5 -mb-px ${tab === t ? 'border-b-2 border-zinc-900' : ''}`}>{t}</span>
          </button>
        ))}
      </div>

      {/* ── 요약 탭 ── */}
      {tab === '요약' && (
        <div className="flex-1 -mx-4 -mb-5 bg-[#EBEBFF] px-4 pt-4 pb-8 flex flex-col gap-3">
          {isProcessing && <ProcessingBanner />}
          {isFailed && <FailedBanner onRetry={() => retryMutation.mutate()} isRetrying={retryMutation.isPending} />}
          <div className="bg-white rounded-xl p-4">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-8 h-8 border-2 border-zinc-200 border-t-[#3B3EFF] rounded-full animate-spin" />
                <p className="text-[13px] text-zinc-400">AI 요약 생성 중...</p>
              </div>
            ) : isFailed ? (
              <p className="text-[14px] text-zinc-400">AI 분석에 실패하여 요약을 생성할 수 없습니다.</p>
            ) : isEditing ? (
              <textarea
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                placeholder="AI 요약 내용을 입력하세요"
                rows={10}
                className="w-full text-[14px] text-zinc-700 leading-relaxed outline-none resize-none bg-transparent placeholder:text-zinc-300"
              />
            ) : record.aiSummary ? (
              <p className="text-[14px] text-zinc-700 leading-relaxed whitespace-pre-wrap">{record.aiSummary}</p>
            ) : (
              <p className="text-[14px] text-zinc-400">AI 요약이 아직 생성되지 않았습니다.</p>
            )}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <button onClick={cancelEdit} className="flex-1 py-3 rounded-xl text-[14px] font-medium text-zinc-500 border border-zinc-200 bg-white">취소</button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !editTitle.trim()}
                className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-white bg-[#3B3EFF] disabled:opacity-50"
              >{saveMutation.isPending ? '저장 중...' : '저장 완료'}</button>
            </div>
          )}
        </div>
      )}

      {/* ── 스크립트 탭 ── */}
      {tab === '스크립트' && (
        <div className="flex-1 -mx-4 -mb-5 bg-[#EBEBFF] px-4 pt-4 pb-8 flex flex-col gap-3">
          {isProcessing && <ProcessingBanner />}
          {isFailed && <FailedBanner onRetry={() => retryMutation.mutate()} isRetrying={retryMutation.isPending} />}
          <div className="bg-white rounded-xl p-4">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-8 h-8 border-2 border-zinc-200 border-t-[#3B3EFF] rounded-full animate-spin" />
                <p className="text-[13px] text-zinc-400">STT 변환 중...</p>
              </div>
            ) : isFailed ? (
              <p className="text-[14px] text-zinc-400">AI 분석에 실패하여 스크립트를 생성할 수 없습니다.</p>
            ) : isEditing ? (
              <textarea
                value={editScript}
                onChange={(e) => setEditScript(e.target.value)}
                placeholder="스크립트 내용을 입력하세요"
                rows={14}
                className="w-full text-[13px] text-zinc-700 leading-relaxed outline-none resize-none bg-transparent placeholder:text-zinc-300"
              />
            ) : record.fullScript ? (
              <p className="text-[13px] text-zinc-700 leading-relaxed whitespace-pre-wrap">{record.fullScript}</p>
            ) : (
              <p className="text-[14px] text-zinc-400">스크립트가 없습니다.</p>
            )}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <button onClick={cancelEdit} className="flex-1 py-3 rounded-xl text-[14px] font-medium text-zinc-500 border border-zinc-200 bg-white">취소</button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !editTitle.trim()}
                className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-white bg-[#3B3EFF] disabled:opacity-50"
              >{saveMutation.isPending ? '저장 중...' : '저장 완료'}</button>
            </div>
          )}
        </div>
      )}

      {/* ── 정보 탭 ── */}
      {tab === '정보' && (
        <div className="flex-1 -mx-4 -mb-5 bg-[#EBEBFF] px-4 pt-4 pb-8 flex flex-col gap-3">
          {isProcessing && <ProcessingBanner />}
          {isFailed && <FailedBanner onRetry={() => retryMutation.mutate()} isRetrying={retryMutation.isPending} />}

          {/* 원본 음성 플레이어 */}
          {record.recFileKey && <AudioPlayer src={record.recFileKey} />}

          {/* 메타 정보 */}
          <div className="bg-white rounded-xl overflow-hidden">
            {[
              { label: '상태',   value: isProcessing ? '처리 중' : isFailed ? '생성 실패' : '완료' },
              { label: '생성일시', value: record.meetingRegDtm },
            ].map(({ label, value }, i, arr) => (
              <div
                key={label}
                className={`flex items-center justify-between px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-zinc-50' : ''}`}
              >
                <span className="text-[13px] text-zinc-400">{label}</span>
                <span className={`text-[13px] font-medium ${
                  label === '상태' && isProcessing ? 'text-amber-500' :
                  label === '상태' && isFailed     ? 'text-red-400'   : 'text-zinc-800'
                }`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
