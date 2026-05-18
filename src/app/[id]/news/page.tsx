'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface NewsResponse {
  newsId: number;
  targetType: string;
  targetId: number;
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
}

const TARGET_BG: Record<string, string> = {
  N: 'bg-amber-100',
  V: 'bg-[#EBEBFF]',
  E: 'bg-green-100',
  M: 'bg-purple-100',
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
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function NewsCard({ news }: { news: NewsResponse }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['comments', news.newsId],
    queryFn: async () => {
      const { data } = await api.get(`/api/news/${news.newsId}/comments`);
      return data.data as CommentResponse[];
    },
    enabled: showComments,
  });

  const addCommentMutation = useMutation({
    mutationFn: () =>
      api.post('/api/news/comments', { newsId: news.newsId, cmtContent: commentText.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', news.newsId] });
      setCommentText('');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (cmtId: number) => api.delete(`/api/news/comments/${cmtId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', news.newsId] }),
  });

  const bgCls = TARGET_BG[news.targetType] ?? 'bg-zinc-100';

  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full ${bgCls} shrink-0 flex items-center justify-center mt-0.5`}>
          <NewsIcon type={news.targetType} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-zinc-800 leading-snug">{news.newsContent}</p>
        </div>
      </div>

      <div className="px-4 pb-3 flex items-center gap-3 border-t border-zinc-50">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-[12px] text-zinc-400 mt-2"
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          댓글 {showComments && comments.length > 0 ? `(${comments.length})` : ''}
        </button>
      </div>

      {showComments && (
        <div className="border-t border-zinc-100 px-4 py-3 flex flex-col gap-3">
          {loadingComments ? (
            <p className="text-[12px] text-zinc-400">불러오는 중...</p>
          ) : (
            <>
              {comments.length === 0 && (
                <p className="text-[12px] text-zinc-400">첫 댓글을 남겨보세요.</p>
              )}
              {comments.map((cmt) => (
                <div key={cmt.cmtId} className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-zinc-200 shrink-0 flex items-center justify-center text-[11px] text-zinc-500 font-medium">
                      {cmt.memId?.slice(0, 1) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-zinc-700 leading-snug">{cmt.cmtContent}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{cmt.cmtRegDtm?.slice(0, 16)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCommentMutation.mutate(cmt.cmtId)}
                    className="shrink-0 text-zinc-300 hover:text-red-400 transition-colors pt-0.5"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </>
          )}

          <div className="flex gap-2 mt-1">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commentText.trim()) addCommentMutation.mutate();
              }}
              placeholder="댓글 입력..."
              className="flex-1 border border-zinc-200 rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-[#3B3EFF] bg-white"
            />
            <button
              disabled={!commentText.trim() || addCommentMutation.isPending}
              onClick={() => addCommentMutation.mutate()}
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

export default function NewsPage() {
  const { id } = useParams<{ id: string }>();

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
        {isLoading && <p className="text-center text-[13px] text-zinc-400 py-10">불러오는 중...</p>}
        {!isLoading && news.length === 0 && (
          <p className="text-center text-[13px] text-zinc-400 py-10">소식이 없습니다.</p>
        )}
        <div className="flex flex-col gap-3">
          {news.map((item) => (
            <NewsCard key={item.newsId} news={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
