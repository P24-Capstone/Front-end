'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useHeaderSlotStore } from '@/store/headerSlot';
import api from '@/lib/api';

const SCOPE_COLOR: Record<string, string> = { 공통: '#FF9E6A', 개인: '#E5638C' };
const AUTH_COLOR: Record<string, string> = { 'AI인증': '#3B3EFF', '수동인증': '#31DBD5' };

interface SubmissionDetail {
  verifyId: number;
  verifyContent: string;
  verifyRegDtm: string;
  aiRejectYn: string;
  aiResult: string | null;
  verifyState: string;
  missionId: number;
  memId: string;
  memNic: string;
  userImg: string | null;
  rejectReason: string | null;
  fileKeys: string[];
}

function RejectPopup({ onConfirm, onCancel }: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-[300px] overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <p className="text-[15px] font-bold text-zinc-900 mb-1">인증을 거절할까요?</p>
          <p className="text-[12px] text-zinc-400 mb-3">거절 사유를 작성하면 멤버에게 전달돼요. (선택)</p>
          <textarea
            className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-[13px] text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-[#3B3EFF] resize-none h-24 transition-colors"
            placeholder="거절 사유를 입력해주세요."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
          />
          <p className="text-[11px] text-zinc-300 text-right mt-1">{reason.length}/200</p>
        </div>
        <div className="flex border-t border-zinc-100">
          <button onClick={onCancel} className="flex-1 py-3.5 text-[14px] font-medium text-zinc-500 border-r border-zinc-100">
            취소
          </button>
          <button onClick={() => onConfirm(reason)} className="flex-1 py-3.5 text-[14px] font-semibold text-red-500">
            거절
          </button>
        </div>
      </div>
    </>
  );
}

export default function SubmissionDetailPage() {
  const { missionId, submissionId } = useParams<{ id: string; missionId: string; submissionId: string }>();
  const searchParams = useSearchParams();
  const { setPageHeader } = useHeaderSlotStore();
  const queryClient = useQueryClient();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const authType   = searchParams.get('authType')   ?? 'AI인증';
  const scope      = searchParams.get('scope')      ?? '공통';
  const title      = searchParams.get('title')      ?? '';
  const subtitle   = searchParams.get('subtitle')   ?? '';
  const memberName = searchParams.get('memberName') ?? '멤버';
  const isAI = authType === 'AI인증';

  useEffect(() => {
    setPageHeader({ title: '인증 확인', hideHamburger: true });
    return () => setPageHeader(null);
  }, [setPageHeader]);

  const { data: detail, isLoading } = useQuery<SubmissionDetail>({
    queryKey: ['submissionDetail', submissionId],
    queryFn: async () => {
      const { data } = await api.get(`/api/missions/submissions/${submissionId}`);
      return data.data;
    },
    enabled: !!submissionId,
  });

  // P 상태: AI 판정 전 → 모임장 수동 승인/거절 가능
  const canManualDecide   = detail?.verifyState === 'P';
  // A·F 상태: AI 또는 제출자가 승인 → 모임장이 강제 R로 변경 가능
  const canForceReject    = detail?.verifyState === 'A' || detail?.verifyState === 'F';

  const handleApprove = async () => {
    setActing(true);
    setActionError(null);
    try {
      await api.patch(`/api/missions/submissions/${submissionId}/approve`);
      await queryClient.invalidateQueries({ queryKey: ['submissionDetail', submissionId] });
      await queryClient.invalidateQueries({ queryKey: ['submissions', missionId] });
    } catch {
      setActionError('승인 처리에 실패했습니다.');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async (reason: string) => {
    setRejectOpen(false);
    setActing(true);
    setActionError(null);
    try {
      await api.patch(`/api/missions/submissions/${submissionId}/reject`, { rejectReason: reason });
      await queryClient.invalidateQueries({ queryKey: ['submissionDetail', submissionId] });
      await queryClient.invalidateQueries({ queryKey: ['submissions', missionId] });
    } catch {
      setActionError('거절 처리에 실패했습니다.');
    } finally {
      setActing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex items-center justify-center">
        <p className="text-[13px] text-zinc-400">불러오는 중...</p>
      </div>
    );
  }

  const aiRejectYn = detail?.aiRejectYn ?? searchParams.get('aiRejectYn') ?? '';

  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex flex-col gap-4">

      {/* 미션 정보 */}
      <div className="bg-white rounded-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
          {isAI ? (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
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

      {/* 제출자 + AI 결과 */}
      <div className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-[#C4B5FD] flex items-center justify-center shrink-0 overflow-hidden">
          {detail?.userImg
            ? <img src={detail.userImg} alt={detail.memNic} className="w-full h-full object-cover" />
            : <span className="text-[13px] font-bold text-white">{(detail?.memNic ?? memberName)[0]}</span>
          }
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-zinc-800">{detail?.memNic ?? memberName}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">제출일: {detail?.verifyRegDtm ?? ''}</p>
        </div>
        {aiRejectYn && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${aiRejectYn === 'N' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              {aiRejectYn === 'N'
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />}
            </svg>
            AI {aiRejectYn === 'N' ? '승인' : '거절'}
          </div>
        )}
      </div>

      {/* 처리 결과 배너 */}
      {(detail?.verifyState === 'A' || detail?.verifyState === 'F') && (
        <div className="bg-emerald-50 rounded-xl px-4 py-3 flex items-center gap-2">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-[13px] font-semibold text-emerald-700">인증을 승인했어요.</p>
        </div>
      )}
      {detail?.verifyState === 'R' && (
        <div className="bg-red-50 rounded-xl px-4 py-3 flex items-center gap-2">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <p className="text-[13px] font-semibold text-red-600">인증을 거절했어요.</p>
        </div>
      )}

      {/* 거절 사유 표시 */}
      {detail?.verifyState === 'R' && detail?.rejectReason && (
        <div className="flex flex-col gap-2">
          <p className="text-[14px] font-semibold text-zinc-800">거절 사유</p>
          <div className="bg-white rounded-xl p-4 border border-red-100">
            <p className="text-[13px] text-zinc-600 leading-relaxed">{detail.rejectReason}</p>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {actionError && (
        <div className="bg-red-50 rounded-xl px-4 py-3">
          <p className="text-[13px] text-red-600">{actionError}</p>
        </div>
      )}

      {/* 제출 내용 */}
      {isAI ? (
        <>
          <p className="text-[14px] font-semibold text-zinc-800">제출한 사진</p>
          {(detail?.fileKeys ?? []).length > 0 ? (
            <div className="flex gap-2.5">
              {(detail?.fileKeys ?? []).map((url, i) => (
                <div key={i} className="w-[88px] h-[88px] rounded-xl overflow-hidden bg-zinc-200 shrink-0">
                  <img src={url} alt="제출 이미지" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-2.5">
              <div className="w-[88px] h-[88px] rounded-xl bg-zinc-200 shrink-0 flex items-center justify-center">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#a1a1aa" strokeWidth={1.5}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {detail?.verifyContent && (
            <div className="flex flex-col gap-2">
              <p className="text-[14px] font-semibold text-zinc-800">인증 내용</p>
              <div className="bg-white rounded-xl p-4">
                <p className="text-[14px] text-zinc-700 leading-relaxed whitespace-pre-wrap">{detail.verifyContent}</p>
              </div>
            </div>
          )}
          {(detail?.fileKeys ?? []).length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[14px] font-semibold text-zinc-800">첨부 파일</p>
              <div className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EBEBFF] flex items-center justify-center shrink-0">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#3B3EFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </div>
                <p className="text-[13px] text-zinc-800 truncate">{detail?.fileKeys[0]?.split('/').pop() ?? '첨부 파일'}</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* AI 결과 상세 */}
      {detail?.aiResult && (
        <div className="flex flex-col gap-2">
          <p className="text-[14px] font-semibold text-zinc-800">AI 판정 결과</p>
          <div className="bg-white rounded-xl p-4">
            <p className="text-[13px] text-zinc-600 leading-relaxed">{detail.aiResult}</p>
          </div>
        </div>
      )}

      {/* P 상태: AI 판정 전 → 모임장 수동 승인 / 거절 */}
      {canManualDecide && (
        <div className="flex gap-3 mt-2">
          <button
            disabled={acting}
            onClick={() => setRejectOpen(true)}
            className="flex-1 h-[52px] border border-red-400 text-red-500 rounded-2xl text-[15px] font-semibold disabled:opacity-50"
          >
            거절
          </button>
          <button
            disabled={acting}
            onClick={handleApprove}
            className="flex-1 h-[52px] bg-[#3B3EFF] text-white rounded-2xl text-[15px] font-bold disabled:opacity-50"
          >
            {acting ? '처리 중...' : '승인'}
          </button>
        </div>
      )}

      {/* A·F 상태: AI/제출자 승인 후 → 모임장 강제 거절(R) 가능 */}
      {canForceReject && (
        <button
          disabled={acting}
          onClick={() => setRejectOpen(true)}
          className="w-full h-[52px] border border-red-400 text-red-500 rounded-2xl text-[15px] font-semibold disabled:opacity-50 mt-2"
        >
          {acting ? '처리 중...' : '강제 거절'}
        </button>
      )}

      {rejectOpen && <RejectPopup onConfirm={handleReject} onCancel={() => setRejectOpen(false)} />}
    </div>
  );
}
