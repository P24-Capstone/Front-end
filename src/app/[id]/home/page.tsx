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
  userImg?: string;
}

interface MemberDashboard {
  streak: number;
  typeCounts: { type: string; label: string; count: number }[];
  topTypeLabel: string;
  avgCertHours: number;
  topRanks: { rank: number; memNic: string; approvedCount: number; isMe: boolean }[];
  myRank: number;
  myApprovedCount: number;
  myMemNic: string;
}

interface LeaderDashboard {
  totalMissions: number;
  totalMembers: number;
  overallAchievementRate: number;
  weeklyTrend: { weekLabel: string; rate: number }[];
  hardMissions: { missionTitle: string; failRate: number }[];
  heatmap: number[][];
  aiSuccessRate: number;
  fallbackRate: number;
}

// ─── SVG Charts ───────────────────────────────────────────────────────────────

function DonutChart({ pct, color, size = 80, sw = 12 }: { pct: number; color: string; size?: number; sw?: number }) {
  const r = (size - sw * 2) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={`${(pct / 100) * c} ${c}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[13px] font-bold">{pct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function LineChart({ points }: { points: { weekLabel: string; rate: number }[] }) {
  if (points.length < 2) return <p className="text-[12px] text-zinc-400 py-4 text-center">데이터 없음</p>;
  const W = 300; const H = 80; const PAD = 8;
  const maxRate = Math.max(...points.map(p => p.rate), 1);
  const xs = points.map((_, i) => PAD + (i / (points.length - 1)) * (W - PAD * 2));
  const ys = points.map(p => H - PAD - (p.rate / maxRate) * (H - PAD * 2));
  const polyline = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  const area = `${xs[0]},${H} ` + xs.map((x, i) => `${x},${ys[i]}`).join(' ') + ` ${xs[xs.length - 1]},${H}`;

  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full">
        <polygon points={area} fill="#3B3EFF" fillOpacity={0.08} />
        <polyline points={polyline} fill="none" stroke="#3B3EFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys[i]} r={3} fill="#3B3EFF" />
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-1">
        {points.map((p, i) => (
          <span key={i} className="text-[9px] text-zinc-400">{p.weekLabel}</span>
        ))}
      </div>
    </div>
  );
}

function Heatmap({ data }: { data: number[][] }) {
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const hours = [0, 3, 6, 9, 12, 15, 18, 21];
  const maxVal = Math.max(...data.flat(), 1);

  const intensityClass = (v: number) => {
    const r = v / maxVal;
    if (r === 0) return 'bg-zinc-100';
    if (r < 0.25) return 'bg-[#EBEBFF]';
    if (r < 0.5) return 'bg-[#a5b4fc]';
    if (r < 0.75) return 'bg-[#6366f1]';
    return 'bg-[#3B3EFF]';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[280px]">
        <div className="flex gap-0.5 mb-0.5 ml-5">
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="flex-1 text-center">
              {hours.includes(h) && <span className="text-[8px] text-zinc-400">{h}</span>}
            </div>
          ))}
        </div>
        {data.map((row, d) => (
          <div key={d} className="flex items-center gap-0.5 mb-0.5">
            <span className="text-[10px] text-zinc-400 w-4 shrink-0">{days[d]}</span>
            {row.map((v, h) => (
              <div key={h} className={`flex-1 aspect-square rounded-[2px] ${intensityClass(v)}`} title={`${days[d]} ${h}시: ${v}건`} />
            ))}
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-2 justify-end">
          {['bg-zinc-100', 'bg-[#EBEBFF]', 'bg-[#a5b4fc]', 'bg-[#6366f1]', 'bg-[#3B3EFF]'].map((cls, i) => (
            <div key={i} className={`w-3 h-3 rounded-[2px] ${cls}`} />
          ))}
          <span className="text-[9px] text-zinc-400">낮음→높음</span>
        </div>
      </div>
    </div>
  );
}

// ─── News Card (same as main) ─────────────────────────────────────────────────

const TARGET_BG: Record<string, string> = {
  N: 'bg-amber-100', V: 'bg-[#EBEBFF]', E: 'bg-green-100',
  M: 'bg-purple-100', I: 'bg-blue-50', A: 'bg-rose-100',
};

function NewsIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    N: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
    V: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#3B3EFF" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    E: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" /><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" /></svg>,
    M: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#9333ea" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    I: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    A: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#e11d48" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  };
  return icons[type] ?? <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const queryClient = useQueryClient();

  const canComment = news.targetType === 'M' || news.targetType === 'A';
  const link = getNewsLink(news);
  const bgCls = TARGET_BG[news.targetType] ?? 'bg-zinc-100';

  const { data: comments = [], isLoading: loadingCmts } = useQuery({
    queryKey: ['comments', news.newsId],
    queryFn: async () => {
      const { data } = await api.get(`/api/news/${news.newsId}/comments`);
      return data.data as CommentResponse[];
    },
    enabled: showComments && canComment,
  });

  const addMut = useMutation({
    mutationFn: () => api.post('/api/news/comments', { newsId: news.newsId, cmtContent: commentText.trim() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['comments', news.newsId] }); setCommentText(''); },
  });
  const editMut = useMutation({
    mutationFn: ({ cmtId, cmtContent }: { cmtId: number; cmtContent: string }) =>
      api.put(`/api/news/comments/${cmtId}`, { cmtContent }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['comments', news.newsId] }); setEditingId(null); },
  });
  const delMut = useMutation({
    mutationFn: (cmtId: number) => api.delete(`/api/news/comments/${cmtId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', news.newsId] }),
  });

  const inner = (
    <div className="flex items-start gap-3 px-3 py-3">
      <div className={`w-8 h-8 rounded-full ${bgCls} shrink-0 flex items-center justify-center`}>
        <NewsIcon type={news.targetType} />
      </div>
      <p className="flex-1 text-[13px] text-zinc-800 leading-snug pt-0.5">{news.newsContent}</p>
      {link && <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#a1a1aa" strokeWidth={2} className="shrink-0 mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>}
    </div>
  );

  if (link) return <Link href={link} className="block bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors">{inner}</Link>;

  return (
    <div className="bg-zinc-50 rounded-xl overflow-hidden">
      {inner}
      {canComment && (
        <>
          <div className="px-3 pb-2 border-t border-zinc-100">
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1 text-[12px] text-zinc-400 mt-2">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              {showComments ? '댓글 접어두기' : '댓글'}
            </button>
          </div>
          {showComments && (
            <div className="border-t border-zinc-100 px-3 py-3 flex flex-col gap-3">
              {loadingCmts ? <p className="text-[12px] text-zinc-400">불러오는 중...</p> : (
                <>
                  {comments.length === 0 && <p className="text-[12px] text-zinc-400">첫 댓글을 남겨보세요.</p>}
                  {comments.map(cmt => {
                    const isMe = cmt.memId === currentUserId;
                    return (
                      <div key={cmt.cmtId} className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-zinc-200 shrink-0 flex items-center justify-center text-[10px] text-zinc-500 font-medium overflow-hidden">
                            {cmt.userImg && cmt.userImg !== 'default' ? <img src={cmt.userImg} alt="" className="w-full h-full object-cover" /> : (cmt.memNic || cmt.memId)?.slice(0, 1) || '?'}
                          </div>
                          {editingId === cmt.cmtId ? (
                            <div className="flex-1 flex gap-2">
                              <input value={editText} onChange={e => setEditText(e.target.value)} className="flex-1 border border-zinc-200 rounded px-2 py-1 text-[12px] outline-none focus:border-[#3B3EFF]" />
                              <button onClick={() => editMut.mutate({ cmtId: cmt.cmtId, cmtContent: editText })} className="text-[11px] font-semibold text-[#3B3EFF]">저장</button>
                              <button onClick={() => setEditingId(null)} className="text-[11px] text-zinc-400">취소</button>
                            </div>
                          ) : (
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-zinc-800 mb-0.5">{cmt.memNic || cmt.memId}</p>
                              <p className="text-[12px] text-zinc-700 leading-snug">{cmt.cmtContent}</p>
                              <p className="text-[10px] text-zinc-400 mt-0.5">{cmt.cmtRegDtm?.slice(0, 16)}</p>
                            </div>
                          )}
                        </div>
                        {isMe && editingId !== cmt.cmtId && (
                          <div className="shrink-0 flex gap-2 pt-0.5">
                            <button onClick={() => { setEditingId(cmt.cmtId); setEditText(cmt.cmtContent); }} className="text-[11px] text-zinc-400 hover:text-[#3B3EFF]">수정</button>
                            <button onClick={() => delMut.mutate(cmt.cmtId)} className="text-[11px] text-zinc-400 hover:text-red-400">삭제</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
              <div className="flex gap-2">
                <input value={commentText} onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && commentText.trim()) addMut.mutate(); }}
                  placeholder="댓글 입력..." className="flex-1 border border-zinc-200 rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-[#3B3EFF] bg-white" />
                <button disabled={!commentText.trim() || addMut.isPending} onClick={() => addMut.mutate()}
                  className="px-3 py-1.5 bg-[#3B3EFF] text-white rounded-lg text-[12px] font-semibold disabled:bg-zinc-200 disabled:text-zinc-400">
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

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-zinc-50 rounded-2xl p-4 ${className}`}>{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[15px] font-bold mb-3">{children}</h2>;
}

// ─── Rank Medal Icons ─────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-base">🥇</span>;
  if (rank === 2) return <span className="text-base">🥈</span>;
  if (rank === 3) return <span className="text-base">🥉</span>;
  return <span className="text-[12px] font-bold text-zinc-500">{rank}위</span>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GroupHomePage() {
  const { id } = useParams<{ id: string }>();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => { const { data } = await api.get('/api/users/me'); return data.data; },
  });
  const currentUserId = user?.userId || '';

  const { data: myMembership } = useQuery({
    queryKey: ['members', 'me', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/me?teamId=${id}`);
      return data.data as { memRole: string; memState: string };
    },
    enabled: !!id,
  });
  const isLeader = myMembership?.memRole === 'L' && myMembership?.memState === 'A';

  const { data: news = [], isLoading: newsLoading } = useQuery({
    queryKey: ['news', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/news?teamId=${id}`);
      return (data.data as NewsResponse[]).slice(0, 5);
    },
    enabled: !!id,
  });

  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: ['dashboard', 'member', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/dashboard/member?teamId=${id}`);
      return data.data as MemberDashboard;
    },
    enabled: !!id,
  });

  const { data: leader, isLoading: leaderLoading } = useQuery({
    queryKey: ['dashboard', 'leader', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/dashboard/leader?teamId=${id}`);
      return data.data as LeaderDashboard;
    },
    enabled: !!id && isLeader,
  });

  const maxTypeCount = Math.max(...(member?.typeCounts.map(t => t.count) ?? [1]), 1);

  return (
    <div className="space-y-6 pt-4">

      {/* ── 최근 소식 ─────────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>최근 소식</SectionTitle>
        <div className="space-y-2">
          {newsLoading && <div className="p-3 rounded-xl bg-zinc-50 animate-pulse h-14" />}
          {!newsLoading && news.length === 0 && <p className="text-[13px] text-zinc-400 py-2">최근 소식이 없습니다.</p>}
          {news.map(item => <HomeNewsCard key={item.newsId} news={item} currentUserId={currentUserId} />)}
        </div>
      </section>

      {/* ── 나의 활동 대시보드 ────────────────────────────────────────────── */}
      <section>
        <SectionTitle>나의 활동</SectionTitle>
        {memberLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="bg-zinc-50 rounded-2xl h-24 animate-pulse" />)}
          </div>
        ) : member ? (
          <div className="space-y-3">

            {/* 연속 달성 + 평균 인증 소요 */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="flex flex-col items-center justify-center gap-1 text-center">
                <span className="text-2xl">🔥</span>
                <p className="text-[22px] font-bold text-zinc-900 leading-none">{member.streak}</p>
                <p className="text-[11px] text-zinc-500">연속 달성</p>
                {member.streak > 0 && (
                  <p className="text-[10px] text-[#3B3EFF] font-semibold">{member.streak}회 연속 중!</p>
                )}
              </Card>
              <Card className="flex flex-col items-center justify-center gap-1 text-center">
                <p className="text-[11px] text-zinc-500 mb-1">평균 인증 소요</p>
                <p className="text-[22px] font-bold text-zinc-900 leading-none">
                  {member.avgCertHours > 0 ? member.avgCertHours.toFixed(1) : '-'}
                </p>
                <p className="text-[11px] text-zinc-500">시간</p>
                {member.avgCertHours > 0 && (
                  <p className="text-[10px] text-zinc-400">미션 시작 후 인증까지</p>
                )}
              </Card>
            </div>

            {/* 주력 미션 유형 */}
            <Card>
              <p className="text-[13px] font-semibold mb-1">주력 미션 유형</p>
              {member.typeCounts.length === 0 ? (
                <p className="text-[12px] text-zinc-400">완료된 미션이 없습니다.</p>
              ) : (
                <>
                  <p className="text-[11px] text-[#3B3EFF] mb-3">
                    {member.myMemNic}님의 주력 분야는 <span className="font-bold">{member.topTypeLabel}</span> 미션입니다.
                  </p>
                  <div className="space-y-2">
                    {member.typeCounts.map(tc => (
                      <div key={tc.type} className="flex items-center gap-2">
                        <span className="text-[12px] text-zinc-600 w-16 shrink-0">{tc.label}</span>
                        <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#3B3EFF]"
                            style={{ width: `${(tc.count / maxTypeCount) * 100}%` }} />
                        </div>
                        <span className="text-[11px] text-zinc-500 w-6 text-right">{tc.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            {/* 나의 랭킹 */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-semibold">나의 랭킹</p>
                {member.myRank > 3 && (
                  <span className="text-[12px] text-zinc-500">나의 순위: <span className="font-bold text-zinc-800">{member.myRank}위</span></span>
                )}
              </div>
              {member.topRanks.length === 0 ? (
                <p className="text-[12px] text-zinc-400">데이터가 없습니다.</p>
              ) : (
                <div className="space-y-2.5">
                  {member.topRanks.map(r => (
                    <div key={r.rank} className={`flex items-center gap-3 px-2 py-1.5 rounded-xl ${r.isMe ? 'bg-[#EBEBFF]' : ''}`}>
                      <div className="w-7 flex items-center justify-center shrink-0">
                        <RankBadge rank={r.rank} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-semibold truncate ${r.isMe ? 'text-[#3B3EFF]' : 'text-zinc-800'}`}>
                          {r.memNic}{r.isMe && ' (나)'}
                        </p>
                      </div>
                      <span className="text-[12px] text-zinc-500 shrink-0">{r.approvedCount}개 완료</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

          </div>
        ) : (
          <p className="text-[13px] text-zinc-400">데이터를 불러올 수 없습니다.</p>
        )}
      </section>

      {/* ── 모임장 전용 대시보드 ─────────────────────────────────────────── */}
      {isLeader && (
        <section>
          <SectionTitle>모임 현황 <span className="text-[12px] font-normal text-zinc-400 ml-1">모임장 전용</span></SectionTitle>
          {leaderLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="bg-zinc-50 rounded-2xl h-32 animate-pulse" />)}
            </div>
          ) : leader ? (
            <div className="space-y-3">

              {/* 전체 달성률 */}
              <div className="grid grid-cols-3 gap-2">
                <Card className="col-span-1 flex flex-col items-center justify-center gap-1 text-center">
                  <p className="text-[10px] text-zinc-500 leading-tight">전체 달성률</p>
                  <p className="text-[22px] font-bold text-[#3B3EFF]">{leader.overallAchievementRate.toFixed(0)}%</p>
                </Card>
                <Card className="col-span-1 flex flex-col items-center justify-center gap-1 text-center">
                  <p className="text-[10px] text-zinc-500">총 미션</p>
                  <p className="text-[22px] font-bold text-zinc-900">{leader.totalMissions}</p>
                </Card>
                <Card className="col-span-1 flex flex-col items-center justify-center gap-1 text-center">
                  <p className="text-[10px] text-zinc-500">모임 인원</p>
                  <p className="text-[22px] font-bold text-zinc-900">{leader.totalMembers}</p>
                </Card>
              </div>

              {/* 주간 달성률 추이 */}
              <Card>
                <p className="text-[13px] font-semibold mb-3">주간 달성률 추이</p>
                {leader.weeklyTrend.every(p => p.rate === 0) ? (
                  <p className="text-[12px] text-zinc-400">아직 데이터가 없습니다.</p>
                ) : (
                  <LineChart points={leader.weeklyTrend} />
                )}
              </Card>

              {/* 최고 난이도 미션 Top 3 */}
              <Card>
                <p className="text-[13px] font-semibold mb-3">최고 난이도 미션 Top 3</p>
                {leader.hardMissions.length === 0 ? (
                  <p className="text-[12px] text-zinc-400">미션이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {leader.hardMissions.map((m, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[12px] text-zinc-700 truncate flex-1 mr-2">{m.missionTitle}</p>
                          <span className="text-[11px] font-semibold text-red-500 shrink-0">{m.failRate.toFixed(0)}% 미달성</span>
                        </div>
                        <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-red-400" style={{ width: `${m.failRate}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* 인증 활성도 히트맵 */}
              <Card>
                <p className="text-[13px] font-semibold mb-3">요일·시간대별 인증 활성도</p>
                <Heatmap data={leader.heatmap} />
              </Card>

              {/* AI 인증 성과 */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="flex flex-col items-center gap-2">
                  <p className="text-[11px] text-zinc-500 text-center">AI 한 번에 통과율</p>
                  <DonutChart pct={leader.aiSuccessRate} color="#3B3EFF" />
                </Card>
                <Card className="flex flex-col items-center gap-2">
                  <p className="text-[11px] text-zinc-500 text-center">수동 전환율</p>
                  <DonutChart pct={leader.fallbackRate} color="#f97316" />
                  <p className="text-[10px] text-zinc-400 text-center -mt-1">AI 거절 → 수동입력</p>
                </Card>
              </div>

            </div>
          ) : (
            <p className="text-[13px] text-zinc-400">데이터를 불러올 수 없습니다.</p>
          )}
        </section>
      )}

    </div>
  );
}
