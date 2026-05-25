'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewsResponse {
  newsId: number;
  targetType: string;
  targetId: number | null;
  newsContent: string;
  teamId: string;
}

interface CommentResponse {
  cmtId: number;
  cmtContent: string;
  cmtRegDtm: string;
  cmtModDtm: string;
  newsId: number;
  memId: string;
  memNic?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNewsLink(item: NewsResponse): string | null {
  if (item.targetId == null) return null;
  const base = `/${item.teamId}`;
  switch (item.targetType) {
    case 'N': return `${base}/notices/${item.targetId}`;
    case 'E': return `${base}/events/${item.targetId}`;
    case 'V': return `${base}/votes/${item.targetId}`;
    case 'I': return `${base}/minutes/${item.targetId}`;
    default:  return null;
  }
}

const TARGET_BG: Record<string, string> = {
  N: 'bg-amber-100',
  V: 'bg-[#EBEBFF]',
  E: 'bg-green-100',
  M: 'bg-purple-100',
  I: 'bg-blue-50',
  A: 'bg-rose-100',
};

function NewsIcon({ type }: { type: string }) {
  if (type === 'N') {
    return (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    );
  }
  if (type === 'V') {
    return (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#3B3EFF" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (type === 'E') {
    return (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2}>
        <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" />
        <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    );
  }
  if (type === 'M') {
    return (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9333ea" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  }
  if (type === 'I') {
    return (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ─── NewsCard ─────────────────────────────────────────────────────────────────

interface NewsCardProps {
  news: NewsResponse;
  currentUserId: string;
  isLeader: boolean;
}

function NewsCard({ news, currentUserId, isLeader }: NewsCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText]   = useState('');
  const [editingId, setEditingId]       = useState<number | null>(null);
  const [editText, setEditText]         = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['comments', news.newsId],
    queryFn: async () => {
      const { data } = await api.get(`/api/news/${news.newsId}/comments`);
      return data.data as CommentResponse[];
    },
    enabled: showComments,
  });

  /* 댓글 등록 */
  const addMutation = useMutation({
    mutationFn: () =>
      api.post('/api/news/comments', { newsId: news.newsId, cmtContent: commentText.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', news.newsId] });
      setCommentText('');
    },
  });

  /* 댓글 수정 */
  const editMutation = useMutation({
    mutationFn: ({ cmtId, cmtContent }: { cmtId: number; cmtContent: string }) =>
      api.put(`/api/news/comments/${cmtId}`, { cmtContent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', news.newsId] });
      setEditingId(null);
    },
  });

  /* 댓글 삭제 */
  const deleteMutation = useMutation({
    mutationFn: (cmtId: number) => api.delete(`/api/news/comments/${cmtId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', news.newsId] }),
  });

  const bgCls   = TARGET_BG[news.targetType] ?? 'bg-zinc-100';
  const link    = getNewsLink(news);
  const canComment = news.targetType === 'M' || news.targetType === 'A';

  const startEdit = (cmt: CommentResponse) => {
    setEditingId(cmt.cmtId);
    setEditText(cmt.cmtContent);
  };

  const cancelEdit = () => setEditingId(null);

  const header = (
    <div className="px-4 py-3 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-full ${bgCls} shrink-0 flex items-center justify-center mt-0.5`}>
        <NewsIcon type={news.targetType} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-zinc-800 leading-snug">{news.newsContent}</p>
      </div>
      {link && (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#a1a1aa" strokeWidth={2} className="shrink-0 mt-0.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );

  /* 링크가 있으면 클릭 시 이동 */
  if (link) {
    return (
      <Link href={link} className="block bg-white rounded-xl overflow-hidden hover:bg-zinc-50 transition-colors">
        {header}
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden">
      {header}

      {/* 댓글 토글 버튼 */}
      {canComment && (
        <div className="px-4 pb-3 flex items-center gap-3 border-t border-zinc-50">
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-[12px] text-zinc-400 mt-2"
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            댓글{showComments && comments.length > 0 ? ` (${comments.length})` : ''}
          </button>
        </div>
      )}

      {/* 댓글 목록 + 입력 */}
      {canComment && showComments && (
        <div className="border-t border-zinc-100 px-4 py-3 flex flex-col gap-3">
          {loadingComments ? (
            <p className="text-[12px] text-zinc-400">불러오는 중...</p>
          ) : (
            <>
              {comments.length === 0 && (
                <p className="text-[12px] text-zinc-400">첫 댓글을 남겨보세요.</p>
              )}

              {comments.map((cmt) => {
                const isMe     = cmt.memId === currentUserId;
                const canEdit  = isMe;                    // 본인만 수정 가능
                const canDelete = isMe || isLeader;       // 본인 or 모임장 삭제 가능

                return (
                  <div key={cmt.cmtId} className="flex items-start justify-between gap-2">
                    {/* 아바타 + 내용 */}
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-zinc-200 shrink-0 flex items-center justify-center text-[11px] text-zinc-500 font-medium">
                        {(cmt.memNic || cmt.memId)?.slice(0, 1) || '?'}
                      </div>

                      {editingId === cmt.cmtId ? (
                        /* ── 수정 모드 ── */
                        <div className="flex-1 flex flex-col gap-1.5">
                          <input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && editText.trim()) {
                                editMutation.mutate({ cmtId: cmt.cmtId, cmtContent: editText.trim() });
                              }
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="w-full border border-[#3B3EFF] rounded-lg px-2.5 py-1.5 text-[13px] outline-none bg-white"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              disabled={!editText.trim() || editMutation.isPending}
                              onClick={() =>
                                editMutation.mutate({ cmtId: cmt.cmtId, cmtContent: editText.trim() })
                              }
                              className="text-[11px] font-semibold text-[#3B3EFF] disabled:opacity-40"
                            >
                              저장
                            </button>
                            <button onClick={cancelEdit} className="text-[11px] text-zinc-400">
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── 보기 모드 ── */
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-zinc-700 mb-0.5">
                            {cmt.memNic || cmt.memId}
                            {isLeader && !isMe && (
                              <span className="ml-1 text-[10px] font-normal text-zinc-400"></span>
                            )}
                          </p>
                          <p className="text-[12px] text-zinc-700 leading-snug">{cmt.cmtContent}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            {cmt.cmtRegDtm?.slice(0, 16)}
                            {cmt.cmtModDtm && cmt.cmtModDtm !== cmt.cmtRegDtm && (
                              <span className="ml-1">(수정됨)</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 수정 / 삭제 버튼 */}
                    {editingId !== cmt.cmtId && (canEdit || canDelete) && (
                      <div className="shrink-0 flex items-center gap-2 pt-0.5">
                        {canEdit && (
                          <button
                            onClick={() => startEdit(cmt)}
                            className="text-[11px] text-zinc-400 hover:text-[#3B3EFF] transition-colors"
                          >
                            수정
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => deleteMutation.mutate(cmt.cmtId)}
                            disabled={deleteMutation.isPending}
                            className="text-[11px] text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-40"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* 댓글 입력 */}
          <div className="flex gap-2 mt-1">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commentText.trim()) addMutation.mutate();
              }}
              placeholder="댓글 입력..."
              className="flex-1 border border-zinc-200 rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-[#3B3EFF] bg-white"
            />
            <button
              disabled={!commentText.trim() || addMutation.isPending}
              onClick={() => addMutation.mutate()}
              className="px-3 py-1.5 bg-[#3B3EFF] text-white rounded-lg text-[12px] font-semibold disabled:bg-zinc-200 disabled:text-zinc-400 transition-colors"
            >
              등록
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewsPage() {
  const { id } = useParams<{ id: string }>();

  /* 현재 로그인 유저 ID */
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/api/users/me');
      return data.data;
    },
  });
  const currentUserId = user?.userId ?? '';

  /* 내 멤버십 (리더 여부) */
  const { data: myMembership } = useQuery({
    queryKey: ['members', 'me', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/me?teamId=${id}`);
      return data.data as { memRole: string; memState: string };
    },
    enabled: !!id,
  });
  const isLeader = myMembership?.memRole === 'L' && myMembership?.memState === 'A';

  /* 소식 목록 */
  const { data: news = [], isLoading } = useQuery({
    queryKey: ['news', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/news?teamId=${id}`);
      return data.data as NewsResponse[];
    },
    enabled: !!id,
  });

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 -mx-4 -mb-5 bg-zinc-100 px-4 pt-4 pb-10">
        {isLoading && (
          <p className="text-center text-[13px] text-zinc-400 py-10">불러오는 중...</p>
        )}
        {!isLoading && news.length === 0 && (
          <p className="text-center text-[13px] text-zinc-400 py-10">소식이 없습니다.</p>
        )}
        <div className="flex flex-col gap-3">
          {news.map((item) => (
            <NewsCard
              key={item.newsId}
              news={item}
              currentUserId={currentUserId}
              isLeader={isLeader}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
