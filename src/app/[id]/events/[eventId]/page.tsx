'use client';

import { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface EventResponse {
  evtId: number;
  evtTitle: string;
  evtContent: string;
  evtLocation: string;
  evtStartDt: string;
  evtEndDt: string;
  evtRegDtm: string;
  teamId: string;
}

interface MemberMe {
  memRole: string;
  memState: string;
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function formatDate(dt: string) {
  const d = new Date(dt);
  const base = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_NAMES[d.getDay()]})`;
  const time = dt.length > 10 ? ` ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}` : '';
  return base + time;
}

export default function EventDetailPage() {
  const { id, eventId } = useParams<{ id: string; eventId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [content, setContent] = useState('');
  const initialized = useRef(false);

  const { data: myMember } = useQuery<MemberMe>({
    queryKey: ['memberMe', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/me?teamId=${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const isLeader = myMember?.memRole === 'L' && myMember?.memState === 'A';

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data } = await api.get(`/api/events/${eventId}`);
      return data.data as EventResponse;
    },
    enabled: !!eventId,
  });

  if (event && !initialized.current) {
    setTitle(event.evtTitle ?? '');
    setLocation(event.evtLocation ?? '');
    setStartDate(event.evtStartDt?.slice(0, 10) ?? '');
    setStartTime(event.evtStartDt?.slice(11, 16) ?? '');
    setEndDate(event.evtEndDt?.slice(0, 10) ?? '');
    setEndTime(event.evtEndDt?.slice(11, 16) ?? '');
    setContent(event.evtContent ?? '');
    initialized.current = true;
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const evtStartDt = startTime ? `${startDate} ${startTime}` : startDate;
      const evtEndDt = endDate ? (endTime ? `${endDate} ${endTime}` : endDate) : null;
      return api.put(`/api/events/${eventId}`, {
        teamId: id,
        evtTitle: title,
        evtContent: content,
        evtLocation: location,
        evtStartDt,
        ...(evtEndDt && { evtEndDt }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events', id] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/events/${eventId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', id] });
      router.back();
    },
  });

  const handleCancel = () => {
    if (event) {
      setTitle(event.evtTitle ?? '');
      setLocation(event.evtLocation ?? '');
      setStartDate(event.evtStartDt?.slice(0, 10) ?? '');
      setStartTime(event.evtStartDt?.slice(11, 16) ?? '');
      setEndDate(event.evtEndDt?.slice(0, 10) ?? '');
      setEndTime(event.evtEndDt?.slice(11, 16) ?? '');
      setContent(event.evtContent ?? '');
    }
    setEditing(false);
  };

  if (isLoading) {
    return <div className="text-center py-20 text-zinc-500 text-sm">불러오는 중...</div>;
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-[14px] text-zinc-400">일정을 찾을 수 없습니다.</p>
        <button onClick={() => router.back()} className="text-[13px] text-blue-500">
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="pt-5 px-1">
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-[300px] p-6 shadow-xl">
            <h3 className="text-[16px] font-bold text-zinc-900 text-center mb-2">일정 삭제</h3>
            <p className="text-[13px] text-zinc-500 text-center mb-6">
              일정을 삭제하면 복구할 수 없습니다.<br />정말 삭제하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-medium text-zinc-600 border border-zinc-200"
              >
                취소
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-red-500 disabled:opacity-60"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 제목 + 아이콘 */}
      <div className="flex items-start gap-2.5 pb-5 border-b border-zinc-100">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#3B3EFF" strokeWidth={1.8} className="shrink-0 mt-0.5">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        {editing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 text-[18px] font-bold text-zinc-900 border-b-2 border-[#3B3EFF] outline-none bg-transparent"
          />
        ) : (
          <h1 className="flex-1 text-[18px] font-bold text-zinc-900 break-words">{event.evtTitle}</h1>
        )}
        {isLeader && !editing && (
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditing(true)} className="text-zinc-400 hover:text-[#3B3EFF] transition-colors">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="text-zinc-400 hover:text-red-400 transition-colors">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="py-5 space-y-4 border-b border-zinc-100">
        {/* 시작 날짜 */}
        <div className="flex items-center gap-3">
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2} className="shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {editing ? (
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 border-b border-zinc-300 text-[13px] text-zinc-700 outline-none bg-transparent focus:border-[#3B3EFF] py-0.5"
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-24 border-b border-zinc-300 text-[13px] text-zinc-700 outline-none bg-transparent focus:border-[#3B3EFF] py-0.5"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-[12px] w-4">~</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 border-b border-zinc-300 text-[13px] text-zinc-700 outline-none bg-transparent focus:border-[#3B3EFF] py-0.5"
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-24 border-b border-zinc-300 text-[13px] text-zinc-700 outline-none bg-transparent focus:border-[#3B3EFF] py-0.5"
                />
              </div>
            </div>
          ) : (
            <span className="text-[14px] text-zinc-700">
              {formatDate(event.evtStartDt)}
              {event.evtEndDt && event.evtStartDt !== event.evtEndDt && ` ~ ${formatDate(event.evtEndDt)}`}
            </span>
          )}
        </div>

        {/* 장소 */}
        <div className="flex items-center gap-3">
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2} className="shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 14 6 14s6-8.75 6-14c0-3.314-2.686-6-6-6z" />
            <circle cx="12" cy="8" r="2" />
          </svg>
          {editing ? (
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="장소 미정"
              className="flex-1 border-b border-zinc-300 text-[14px] text-zinc-700 outline-none bg-transparent focus:border-[#3B3EFF] py-0.5"
            />
          ) : (
            <span className="text-[14px] text-zinc-700">{event.evtLocation || '장소 미정'}</span>
          )}
        </div>
      </div>

      {/* 상세 */}
      <div className="pt-5">
        <p className="text-[14px] font-semibold text-zinc-900 mb-3">상세</p>
        {editing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-32 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] text-zinc-600 outline-none focus:border-[#3B3EFF] resize-none"
          />
        ) : (
          event.evtContent?.split('\n').map((line, i) => (
            <p key={i} className="text-[14px] text-zinc-600 leading-relaxed">{line}</p>
          ))
        )}
      </div>

      {editing && (
        <div className="flex gap-3 mt-8">
          <button
            onClick={handleCancel}
            className="flex-1 py-3.5 rounded-xl text-[14px] font-semibold bg-zinc-100 text-zinc-600"
          >
            취소
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !title.trim() || !startDate}
            className={`flex-1 py-3.5 rounded-xl text-[14px] font-semibold transition-colors ${!saveMutation.isPending && title.trim() && startDate ? 'bg-[#3B3EFF] text-white' : 'bg-zinc-200 text-zinc-400'}`}
          >
            {saveMutation.isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      )}
    </div>
  );
}