'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useHeaderSlotStore } from '@/store/headerSlot';

export default function CreateEventPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();
  const { setPageHeader } = useHeaderSlotStore();

  useEffect(() => {
    setPageHeader({ title: '새 일정 등록하기', hideHamburger: true });
    return () => setPageHeader(null);
  }, [setPageHeader]);

  const [formData, setFormData] = useState({
    evtTitle: '',
    evtContent: '',
    evtLocation: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/api/events', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events', id] });
      if (data && data.data && data.data.evtId) {
        router.push(`/${id}/events/${data.data.evtId}`);
      } else {
        router.push(`/${id}/events`);
      }
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || '일정 등록에 실패했습니다. (모임장만 등록 가능할 수 있습니다.)';
      alert(msg);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startDt = formData.startTime
      ? `${formData.startDate}`
      : formData.startDate;
    const endDt = formData.endDate
      ? formData.endTime
        ? `${formData.endDate}`
        : formData.endDate
      : null;

    createEventMutation.mutate({
      teamId: id,
      evtTitle: formData.evtTitle,
      evtContent: formData.evtContent,
      evtLocation: formData.evtLocation,
      evtStartDt: startDt,
      ...(endDt && { evtEndDt: endDt }),
    });
  };

  const inputCls = 'w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] outline-none focus:border-[#3B3EFF] focus:bg-white transition-colors placeholder:text-zinc-400';

  return (
    <div className="pt-2 px-1 pb-20">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[13px] font-semibold text-zinc-800">일정 제목</label>
          <input
            type="text"
            required
            placeholder="예) 첫 정기 모임"
            className={inputCls}
            value={formData.evtTitle}
            onChange={(e) => setFormData({ ...formData, evtTitle: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-semibold text-zinc-800">장소</label>
          <input
            type="text"
            placeholder="예) 스타벅스 홍대점, 온라인 (Zoom)"
            className={inputCls}
            value={formData.evtLocation}
            onChange={(e) => setFormData({ ...formData, evtLocation: e.target.value })}
          />
        </div>

        {/* 시작 일자 */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-semibold text-zinc-800">시작 일자</label>
          <input
            type="date"
            required
            className={inputCls}
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>

        {/* 종료 일자 (선택) */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-semibold text-zinc-800">
            종료 일자 <span className="text-[12px] font-normal text-zinc-400">(선택)</span>
          </label>
          <input
            type="date"
            className={inputCls}
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-semibold text-zinc-800">상세 내용</label>
          <textarea
            required
            placeholder="어떤 일정인지 자세히 적어주세요."
            className="w-full h-32 p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] outline-none focus:border-[#3B3EFF] focus:bg-white transition-colors resize-none placeholder:text-zinc-400"
            value={formData.evtContent}
            onChange={(e) => setFormData({ ...formData, evtContent: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={createEventMutation.isPending || !formData.evtTitle.trim() || !formData.startDate || !formData.evtContent.trim()}
          className="w-full h-[52px] mt-6 bg-[#3B3EFF] text-white rounded-xl text-[15px] font-bold disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors flex items-center justify-center"
        >
          {createEventMutation.isPending ? (
            <div className="w-5 h-5 border-2 border-zinc-500 border-t-white rounded-full animate-spin" />
          ) : (
            '일정 등록'
          )}
        </button>
      </form>
    </div>
  );
}