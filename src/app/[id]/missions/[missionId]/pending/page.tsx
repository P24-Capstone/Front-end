'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useHeaderSlotStore } from '@/store/headerSlot';
import api from '@/lib/api';

const SCOPE_COLOR: Record<string, string> = { 공통: '#FF9E6A', 개인: '#E5638C' };
const AUTH_COLOR:  Record<string, string> = { 'AI인증': '#3B3EFF', '수동인증': '#31DBD5' };

interface VerifyDetail {
  verifyId:      number;
  verifyContent: string;
  verifyRegDtm:  string;
  verifyState:   string;       // P / A / R / F
  aiRejectYn:    string | null; // Y / N / null
  aiResult:      string | null;
  rejectReason:  string | null;
  fileKeys:      string[];
}

/* ── 미션 정보 카드 ── */
function MissionInfoCard({ scope, authType, title, subtitle, isAI }: {
  scope: string; authType: string; title: string; subtitle: string; isAI: boolean;
}) {
  return (
    <div className="bg-white rounded-xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
        {isAI ? (
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        ) : (
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex gap-1.5 mb-1.5">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: SCOPE_COLOR[scope] ?? '#FF9E6A' }}>{scope}</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: AUTH_COLOR[authType] ?? '#3B3EFF' }}>{authType}</span>
        </div>
        <p className="text-[14px] font-bold text-zinc-900 leading-snug">{title}</p>
        <p className="text-[12px] text-zinc-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

/* ── 확인 팝업 ── */
function ConfirmPopup({ message, confirmLabel, confirmClass, onConfirm, onCancel }: {
  message: string; confirmLabel: string; confirmClass: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-[300px] overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <p className="text-[15px] font-bold text-zinc-900 text-center whitespace-pre-line">{message}</p>
        </div>
        <div className="flex border-t border-zinc-100">
          <button onClick={onCancel} className="flex-1 py-3.5 text-[14px] font-medium text-zinc-500 border-r border-zinc-100">취소</button>
          <button onClick={onConfirm} className={`flex-1 py-3.5 text-[14px] font-semibold ${confirmClass}`}>{confirmLabel}</button>
        </div>
      </div>
    </>
  );
}

/* ── 재요청 이미지 선택 팝업 ── */
function ResubmitPanel({ current, onSubmit, onCancel, submitting }: {
  current: VerifyDetail;
  onSubmit: (imageUrl: string | null, text: string) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [imageItem, setImageItem]   = useState<{ file: File; preview: string } | null>(null);
  const [text, setText]             = useState(current.verifyContent ?? '');
  const fileInputRef                = useRef<HTMLInputElement>(null);
  const [uploading, setUploading]   = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setImageItem({ file: f, preview: URL.createObjectURL(f) });
    e.target.value = '';
  };

  const handleSubmit = async () => {
    setUploading(true);
    try {
      let imageUrl: string | null = null;
      if (imageItem) {
        const form = new FormData();
        form.append('file', imageItem.file);
        const { data } = await api.post('/api/files/upload?type=missionVerify', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = data.data as string;
      }
      onSubmit(imageUrl, text);
    } catch {
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const previewSrc = imageItem?.preview ?? current.fileKeys[0] ?? null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onCancel} />
      <div className="fixed left-1/2 bottom-0 -translate-x-1/2 z-50 bg-white rounded-t-3xl w-full max-w-[390px] p-5 flex flex-col gap-4">
        <p className="text-[16px] font-bold text-zinc-900">사진 및 내용 수정 후 재요청</p>

        {/* 이미지 선택 */}
        <div className="flex gap-3 items-center">
          {previewSrc ? (
            <div className="relative w-[88px] h-[88px] rounded-xl overflow-hidden bg-zinc-100 shrink-0">
              <img src={previewSrc} alt="" className="w-full h-full object-cover" />
              {imageItem && (
                <button onClick={() => setImageItem(null)}
                  className="absolute top-1 right-1 w-5 h-5 bg-white/80 rounded-full flex items-center justify-center">
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ) : null}
          <button onClick={() => fileInputRef.current?.click()}
            className="w-[88px] h-[88px] rounded-xl border-2 border-dashed border-zinc-200 hover:border-[#3B3EFF] flex flex-col items-center justify-center text-zinc-400 text-[11px] gap-1 shrink-0">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            새 사진
          </button>
          <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleFile} />
        </div>

        {/* 텍스트 */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="AI에게 한 줄로 설명해 주세요."
          rows={2}
          maxLength={200}
          className="w-full text-[13px] text-zinc-800 placeholder:text-zinc-300 outline-none resize-none border border-zinc-200 rounded-lg px-3 py-2 focus:border-[#3B3EFF] transition-colors"
        />

        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 h-[48px] border border-zinc-200 text-zinc-500 rounded-2xl text-[14px] font-semibold">취소</button>
          <button onClick={handleSubmit} disabled={submitting || uploading}
            className="flex-1 h-[48px] bg-[#3B3EFF] text-white rounded-2xl text-[14px] font-bold disabled:bg-zinc-300">
            {uploading ? '업로드 중...' : submitting ? '재요청 중...' : 'AI 재요청'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════ */
export default function MissionPendingPage() {
  const { id, missionId } = useParams<{ id: string; missionId: string }>();
  const router            = useRouter();
  const searchParams      = useSearchParams();
  const { setPageHeader } = useHeaderSlotStore();
  const queryClient       = useQueryClient();

  const authType   = searchParams.get('authType')   ?? 'AI인증';
  const scope      = searchParams.get('scope')      ?? '공통';
  const title      = searchParams.get('title')      ?? '';
  const subtitle   = searchParams.get('subtitle')   ?? '';
  const verifyPrompt = searchParams.get('verifyPrompt') ?? '';
  const isAI       = authType === 'AI인증';

  const [acting, setActing]                 = useState(false);
  const [showDeleteConfirm, setDeleteConfirm] = useState(false);
  const [showForceConfirm, setForceConfirm]   = useState(false);
  const [showResubmit, setShowResubmit]       = useState(false);
  const [actionError, setActionError]         = useState<string | null>(null);

  const { data: submission, isLoading, isError } = useQuery<VerifyDetail>({
    queryKey: ['mySubmission', missionId],
    queryFn: async () => {
      const { data } = await api.get(`/api/missions/${missionId}/submissions/me`);
      return data.data as VerifyDetail;
    },
    refetchInterval: (q) => q.state.data?.verifyState === 'P' ? 5000 : false, // P 상태일 때 5초마다 폴링
    retry: false,
  });

  type Status = 'pending' | 'ai_approved' | 'ai_rejected' | 'force_approved' | 'none';
  const status: Status =
    isError || !submission          ? 'none'
    : submission.verifyState === 'A' ? 'ai_approved'
    : submission.verifyState === 'F' ? 'force_approved'
    : submission.verifyState === 'R' && submission.aiRejectYn === 'Y' ? 'ai_rejected'
    : submission.verifyState === 'R' ? 'ai_rejected'
    : 'pending';

  const HEADER: Record<Status, string> = {
    none:          '인증 현황',
    pending:       '제출한 인증',
    ai_approved:   'AI 인증 완료',
    ai_rejected:   'AI 인증 실패',
    force_approved:'인증 완료',
  };

  useEffect(() => {
    setPageHeader({ title: HEADER[status], hideHamburger: true });
    return () => setPageHeader(null);
  }, [setPageHeader, status]);

  const verifyHref = `/${id}/missions/${missionId}/verify?authType=${encodeURIComponent(authType)}&scope=${encodeURIComponent(scope)}&title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subtitle)}&verifyPrompt=${encodeURIComponent(verifyPrompt)}`;

  /* ── 액션 핸들러 ── */
  const handleDelete = async () => {
    setDeleteConfirm(false);
    setActing(true);
    setActionError(null);
    try {
      await api.delete(`/api/missions/submissions/${submission!.verifyId}`);
      await queryClient.invalidateQueries({ queryKey: ['mySubmission', missionId] });
      router.back();
    } catch {
      setActionError('삭제에 실패했습니다.');
    } finally {
      setActing(false);
    }
  };

  const handleForceApprove = async () => {
    setForceConfirm(false);
    setActing(true);
    setActionError(null);
    try {
      await api.patch(`/api/missions/submissions/${submission!.verifyId}/force-approve`);
      await queryClient.invalidateQueries({ queryKey: ['mySubmission', missionId] });
    } catch {
      setActionError('강제 승인에 실패했습니다.');
    } finally {
      setActing(false);
    }
  };

  const handleResubmit = async (imageUrl: string | null, text: string) => {
    setActing(true);
    setActionError(null);
    try {
      await api.patch(`/api/missions/submissions/${submission!.verifyId}/resubmit`, {
        verifyContent: text,
        imageUrl,
      });
      setShowResubmit(false);
      await queryClient.invalidateQueries({ queryKey: ['mySubmission', missionId] });
    } catch {
      setActionError('재요청에 실패했습니다.');
    } finally {
      setActing(false);
    }
  };

  /* ── 로딩 ── */
  if (isLoading) return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex flex-col gap-4">
      <MissionInfoCard scope={scope} authType={authType} title={title} subtitle={subtitle} isAI={isAI} />
      <p className="text-center text-[13px] text-zinc-400 py-10">불러오는 중...</p>
    </div>
  );

  /* ── 미제출 ── */
  if (status === 'none') return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex flex-col gap-4">
      <MissionInfoCard scope={scope} authType={authType} title={title} subtitle={subtitle} isAI={isAI} />
      <div className="bg-white rounded-xl px-4 py-6 flex flex-col items-center gap-2">
        <p className="text-[14px] font-semibold text-zinc-800">아직 제출한 인증이 없어요.</p>
        <p className="text-[12px] text-zinc-400">미션 인증을 제출해보세요!</p>
      </div>
      <button onClick={() => router.push(verifyHref)}
        className="w-full h-[52px] bg-[#3B3EFF] text-white rounded-2xl text-[15px] font-bold mt-2">
        인증 제출하기
      </button>
    </div>
  );

  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex flex-col gap-4">

      <MissionInfoCard scope={scope} authType={authType} title={title} subtitle={subtitle} isAI={isAI} />

      {/* ── 상태 배너 ── */}
      {status === 'pending' && (
        <div className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-zinc-800">AI가 분석 중이에요</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">제출일: {submission?.verifyRegDtm}</p>
          </div>
          <span className="text-[11px] font-semibold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full">대기</span>
        </div>
      )}
      {(status === 'ai_approved' || status === 'force_approved') && (
        <div className="bg-emerald-50 rounded-xl px-4 py-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-zinc-800">
              {status === 'ai_approved' ? 'AI가 인증을 승인했어요!' : '인증이 완료됐어요!'}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">제출일: {submission?.verifyRegDtm}</p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full">
            {status === 'ai_approved' ? 'AI승인' : '완료'}
          </span>
        </div>
      )}
      {status === 'ai_rejected' && (
        <div className="bg-red-50 rounded-xl px-4 py-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-zinc-800">AI가 인증을 인식하지 못했어요</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">제출일: {submission?.verifyRegDtm}</p>
          </div>
          <span className="text-[11px] font-semibold text-red-500 bg-red-100 px-2.5 py-1 rounded-full">거절</span>
        </div>
      )}

      {/* ── 에러 ── */}
      {actionError && (
        <div className="bg-red-50 rounded-xl px-4 py-3">
          <p className="text-[13px] text-red-600">{actionError}</p>
        </div>
      )}

      {/* ── AI 판정 결과 (A / R) ── */}
      {submission?.aiResult && (status === 'ai_approved' || status === 'ai_rejected') && (
        <div className="flex flex-col gap-2">
          <p className="text-[14px] font-semibold text-zinc-800">AI 판정 결과</p>
          <div className={`bg-white rounded-xl p-4 border ${status === 'ai_approved' ? 'border-emerald-100' : 'border-red-100'}`}>
            <p className="text-[13px] text-zinc-600 leading-relaxed">{submission.aiResult}</p>
          </div>
        </div>
      )}

      {/* ── 제출한 사진 ── */}
      {isAI && (
        <>
          <p className="text-[14px] font-semibold text-zinc-800">제출한 사진</p>
          <div className="flex gap-2.5">
            {(submission?.fileKeys ?? []).map((url, i) => (
              <div key={i} className="w-[88px] h-[88px] rounded-xl overflow-hidden bg-zinc-200 shrink-0">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </>
      )}
      {!isAI && submission?.verifyContent && (
        <div className="flex flex-col gap-2">
          <p className="text-[14px] font-semibold text-zinc-800">인증 내용</p>
          <div className="bg-white rounded-xl p-4">
            <p className="text-[14px] text-zinc-700 leading-relaxed whitespace-pre-wrap">{submission.verifyContent}</p>
          </div>
        </div>
      )}

      {/* ── P 상태: AI 분석 안내 + 삭제 ── */}
      {status === 'pending' && (
        <>
          <div className="flex items-start gap-2 bg-[#EEF0FF] rounded-xl px-4 py-3">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#3B3EFF" strokeWidth={2} className="shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-[12px] text-[#3B3EFF] leading-relaxed">
              AI가 사진을 분석 중이에요. 결과는 보통 1분 이내에 나와요.<br />
              분석이 오래 걸린다면 AI 재요청을 눌러보세요.
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            <button disabled={acting} onClick={() => setDeleteConfirm(true)}
              className="flex-1 h-[52px] border border-red-300 text-red-500 rounded-2xl text-[15px] font-semibold disabled:opacity-50">
              삭제
            </button>
            <button disabled={acting} onClick={() => setShowResubmit(true)}
              className="flex-1 h-[52px] bg-zinc-800 text-white rounded-2xl text-[15px] font-bold disabled:opacity-50">
              AI 재요청
            </button>
          </div>
        </>
      )}

      {/* ── R 상태: 재요청 + 강제 승인 ── */}
      {status === 'ai_rejected' && (
        <div className="flex gap-3 mt-2">
          <button disabled={acting} onClick={() => setForceConfirm(true)}
            className="flex-1 h-[52px] border border-zinc-300 text-zinc-600 rounded-2xl text-[15px] font-semibold disabled:opacity-50">
            강제 승인
          </button>
          <button disabled={acting} onClick={() => setShowResubmit(true)}
            className="flex-1 h-[52px] bg-[#3B3EFF] text-white rounded-2xl text-[15px] font-bold disabled:opacity-50">
            재요청하기
          </button>
        </div>
      )}

      {/* ── 팝업들 ── */}
      {showDeleteConfirm && (
        <ConfirmPopup
          message={'제출한 인증을 삭제할까요?\n삭제 후에는 복구할 수 없어요.'}
          confirmLabel="삭제"
          confirmClass="text-red-500"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}
      {showForceConfirm && (
        <ConfirmPopup
          message={'AI 판정을 무시하고\n인증을 강제 승인할까요?'}
          confirmLabel="강제 승인"
          confirmClass="text-[#3B3EFF] font-bold"
          onConfirm={handleForceApprove}
          onCancel={() => setForceConfirm(false)}
        />
      )}
      {showResubmit && submission && (
        <ResubmitPanel
          current={submission}
          onSubmit={handleResubmit}
          onCancel={() => setShowResubmit(false)}
          submitting={acting}
        />
      )}
    </div>
  );
}
