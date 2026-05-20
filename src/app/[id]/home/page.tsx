'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

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
  userImg?: string;
}

interface DashboardSummaryResponse {
  averageActivityHours: number;
  missionRank: number;
  weeklyProgressPercent: number;
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
  if (type === 'N') return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
  if (type === 'V') return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#3B3EFF" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  if (type === 'E') return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" />
      <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
  if (type === 'M') return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#9333ea" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
  if (type === 'I') return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
  if (type === 'A') return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#e11d48" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function getNewsLink(item: NewsResponse): string | null {
  if (item.targetId == null) return null;
  const base = `/${item.teamId}`;
  switch (item.targetType) {
    case 'N': return `${base}/notices/${item.targetId}`;
    case 'E': return `${base}/events/${item.targetId}`;
    case 'V': return `${base}/votes/${item.targetId}`;
    case 'I': return `${base}/minutes/${item.targetId}`;
    default: return null;
  }
}

function HomeNewsCard({ news, currentUserId }: { news: NewsResponse; currentUserId: string }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const queryClient = useQueryClient();

  const canComment = news.targetType === 'M' || news.targetType === 'A';
  const link = getNewsLink(news);
  const bgCls = TARGET_BG[news.targetType] ?? 'bg-zinc-100';

  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['comments', news.newsId],
    queryFn: async () => {
      const { data } = await api.get(`/api/news/${news.newsId}/comments`);
      return data.data as CommentResponse[];
    },
    enabled: showComments && canComment,
  });

  const addCommentMutation = useMutation({
    mutationFn: () =>
      api.post('/api/news/comments', { newsId: news.newsId, cmtContent: commentText.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', news.newsId] });
      setCommentText('');
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ cmtId, cmtContent }: { cmtId: number; cmtContent: string }) =>
      api.put(`/api/news/comments/${cmtId}`, { cmtContent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', news.newsId] });
      setEditingCommentId(null);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (cmtId: number) => api.delete(`/api/news/comments/${cmtId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', news.newsId] }),
  });

  const inner = (
    <div className="flex items-start gap-3 px-3 py-3">
      <div className={`w-8 h-8 rounded-full ${bgCls} shrink-0 flex items-center justify-center`}>
        <NewsIcon type={news.targetType} />
      </div>
      <p className="flex-1 text-[13px] text-zinc-800 leading-snug pt-0.5">{news.newsContent}</p>
      {link && (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#a1a1aa" strokeWidth={2} className="shrink-0 mt-0.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors">
        {inner}
      </Link>
    );
  }

  return (
    <div className="bg-zinc-50 rounded-xl overflow-hidden">
      {inner}
      {canComment && (
        <>
          <div className="px-3 pb-2 border-t border-zinc-100">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 text-[12px] text-zinc-400 mt-2"
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {showComments ? '댓글 접어두기' : '댓글'}
            </button>
          </div>
          {showComments && (
            <div className="border-t border-zinc-100 px-3 py-3 flex flex-col gap-3">
              {loadingComments ? (
                <p className="text-[12px] text-zinc-400">불러오는 중...</p>
              ) : (
                <>
                  {comments.length === 0 && (
                    <p className="text-[12px] text-zinc-400">첫 댓글을 남겨보세요.</p>
                  )}
                  {comments.map((cmt) => {
                    const isMyComment = cmt.memId === currentUserId;
                    return (
                      <div key={cmt.cmtId} className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-zinc-200 shrink-0 flex items-center justify-center text-[10px] text-zinc-500 font-medium overflow-hidden">
                            {cmt.userImg && cmt.userImg !== 'default' ? (
                              <img src={cmt.userImg} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              (cmt.memNic || cmt.memId)?.slice(0, 1) || '?'
                            )}
                          </div>
                          {editingCommentId === cmt.cmtId ? (
                            <div className="flex-1 min-w-0 flex gap-2">
                              <input
                                value={editCommentText}
                                onChange={(e) => setEditCommentText(e.target.value)}
                                className="flex-1 border border-zinc-200 rounded px-2 py-1 text-[12px] outline-none focus:border-[#3B3EFF]"
                              />
                              <button
                                onClick={() => updateCommentMutation.mutate({ cmtId: cmt.cmtId, cmtContent: editCommentText })}
                                className="text-[11px] font-semibold text-[#3B3EFF] shrink-0"
                              >
                                저장
                              </button>
                              <button onClick={() => setEditingCommentId(null)} className="text-[11px] text-zinc-400 shrink-0">
                                취소
                              </button>
                            </div>
                          ) : (
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-zinc-800 mb-0.5">{cmt.memNic || cmt.memId}</p>
                              <p className="text-[12px] text-zinc-700 leading-snug">{cmt.cmtContent}</p>
                              <p className="text-[10px] text-zinc-400 mt-0.5">{cmt.cmtRegDtm?.slice(0, 16)}</p>
                            </div>
                          )}
                        </div>
                        {isMyComment && editingCommentId !== cmt.cmtId && (
                          <div className="shrink-0 flex items-center gap-2 pt-0.5">
                            <button
                              onClick={() => { setEditingCommentId(cmt.cmtId); setEditCommentText(cmt.cmtContent); }}
                              className="text-[11px] text-zinc-400 hover:text-[#3B3EFF] transition-colors"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => deleteCommentMutation.mutate(cmt.cmtId)}
                              className="text-[11px] text-zinc-400 hover:text-red-400 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && commentText.trim()) addCommentMutation.mutate(); }}
                  placeholder="댓글 입력..."
                  className="flex-1 border border-zinc-200 rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-[#3B3EFF] bg-white"
                />
                <button
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                  onClick={() => addCommentMutation.mutate()}
                  className="px-3 py-1.5 bg-[#3B3EFF] text-white rounded-lg text-[12px] font-semibold disabled:bg-zinc-200 disabled:text-zinc-400"
                >
                  등록
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CircleProgress({ pct, size = 84, sw = 7, color = '#111827' }: { pct: number; size?: number; sw?: number; color?: string }) {
  const r = (size - sw * 2) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={`${(pct / 100) * c} ${c}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  );
}

function DonutChart({ pct, label, color }: { pct: number; label: string; color: string }) {
  const size = 110; const sw = 14;
  const r = (size - sw * 2) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
            strokeDasharray={`${(pct / 100) * c} ${c}`} strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-bold">{pct}%</span>
        </div>
      </div>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}

export default function GroupHomePage() {
  const { id } = useParams<{ id: string }>();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/api/users/me');
      return data.data;
    },
  });
  const currentUserId = user?.userId || '';

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const { data } = await api.get('/api/dashboard/summary');
      return data.data as DashboardSummaryResponse;
    },
  });

  const { data: news = [], isLoading: newsLoading } = useQuery({
    queryKey: ['news', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/news?teamId=${id}`);
      return (data.data as NewsResponse[]).slice(0, 5);
    },
    enabled: !!id,
  });

  const activityHours = dashboard?.averageActivityHours ?? 0;
  const missionRank = dashboard?.missionRank ?? 0;
  const weeklyPct = dashboard?.weeklyProgressPercent ?? 0;

  return (
    <div className="space-y-6 pt-4">
      {/* 최근 소식 */}
      <section>
        <h2 className="text-[15px] font-bold mb-3">최근 소식</h2>
        <div className="space-y-2">
          {newsLoading && (
            <div className="p-3 rounded-xl bg-zinc-50 animate-pulse h-14" />
          )}
          {!newsLoading && news.length === 0 && (
            <p className="text-[13px] text-zinc-400 py-2">최근 소식이 없습니다.</p>
          )}
          {news.map((item) => (
            <HomeNewsCard key={item.newsId} news={item} currentUserId={currentUserId} />
          ))}
        </div>
      </section>

      {/* 나의 대시보드 */}
      <section>
        <h2 className="text-[15px] font-bold mb-3">나의 대시보드</h2>
        {dashLoading ? (
          <div className="space-y-3">
            <div className="bg-zinc-50 rounded-2xl h-32 animate-pulse" />
            <div className="bg-zinc-50 rounded-2xl h-32 animate-pulse" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-zinc-50 rounded-2xl p-4 flex flex-col items-center">
                <p className="text-[11px] text-zinc-500 mb-3 text-center">평균 활동 시간</p>
                <div className="relative">
                  <CircleProgress pct={Math.min(Math.round((activityHours / 8) * 100), 100)} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[18px] font-bold leading-none">{activityHours.toFixed(1)}</span>
                    <span className="text-[10px] text-zinc-400 mt-0.5">시간</span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">{Math.min(Math.round((activityHours / 8) * 100), 100)}%</p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-4 flex flex-col justify-center items-center gap-2">
                <p className="text-[11px] text-zinc-500">나의 미션 순위</p>
                <p className="text-[28px] font-bold text-zinc-900 leading-none">{missionRank}위</p>
                <p className="text-[11px] text-zinc-400">이번 주 기준</p>
              </div>
            </div>
            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-[13px] font-semibold mb-4">개인별 주차 미션 성취</p>
              <div className="flex justify-around items-center">
                <DonutChart pct={weeklyPct} label="나의달성" color="#111827" />
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
