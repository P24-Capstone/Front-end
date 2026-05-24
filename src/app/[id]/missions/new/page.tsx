'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useHeaderSlotStore } from '@/store/headerSlot';
import api from '@/lib/api';

const INPUT_CLS = 'w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-[14px] text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-[#3B3EFF] transition-colors bg-white';

interface MemberResponse {
  memId: string;
  memNic: string;
  memRole: string;
  memState: string;
  imgFileKey: string | null;
}

export default function MissionNewPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const { setPageHeader } = useHeaderSlotStore();

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['members', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members?teamId=${id}`);
      return (data.data as MemberResponse[]).filter((m) => m.memState === 'A');
    },
    enabled: !!id,
  });

  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<'공통' | '개인'>('공통');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPageHeader({
      title: '미션 생성',
      hideHamburger: true,
    });
    return () => setPageHeader(null);
  }, [setPageHeader]);

  const canSubmit = title.trim() && startDate && endDate && content.trim() && (scope === '공통' || !!selectedMemberId);

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.post('/api/missions', {
        missionTitle: title.trim(),
        missionContent: content.trim(),
        missionType: scope === '개인' ? 'P' : 'A',
        verifyPrompt: null,
        missionStartDtm: `${startDate} 00:00:00`,
        missionEndDtm: `${endDate} 23:59:59`,
        teamId: id,
      });
      router.back();
    } catch (err) {
      console.error('미션 등록 실패:', err);
      alert('미션 등록에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex flex-col gap-4">

      {/* 기본 정보 카드 */}
      <div className="bg-white rounded-xl p-4 flex flex-col gap-4">
        {/* 미션명 */}
        <div>
          <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">미션명</label>
          <input
            className={INPUT_CLS}
            placeholder="예) 책 읽고 인증하기"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* 대상자 */}
        <div className="flex flex-col gap-2">
          <label className="block text-[13px] font-medium text-zinc-500">대상자</label>
          <div className="flex gap-2">
            {(['공통', '개인'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setScope(s); setSelectedMemberId(null); }}
                className={`flex-1 py-2.5 rounded-lg border text-[14px] font-medium transition-colors ${
                  scope === s ? 'bg-[#3B3EFF] border-[#3B3EFF] text-white' : 'border-zinc-200 text-zinc-400 bg-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {scope === '개인' && (
            <div className="flex flex-col gap-2">
              <p className="text-[12px] text-zinc-400">부여할 멤버를 선택해주세요.</p>
              {membersLoading ? (
                <p className="text-[12px] text-zinc-400 py-2">불러오는 중...</p>
              ) : (members ?? []).length === 0 ? (
                <p className="text-[12px] text-zinc-400 py-2">활동 중인 멤버가 없습니다.</p>
              ) : (
                (members ?? []).map((mem) => (
                  <button
                    key={mem.memId}
                    onClick={() => setSelectedMemberId(mem.memId)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                      selectedMemberId === mem.memId ? 'border-[#3B3EFF] bg-[#EBEBFF]' : 'border-zinc-200 bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#C4B5FD] flex items-center justify-center shrink-0 overflow-hidden">
                      {mem.imgFileKey ? (
                        <img src={mem.imgFileKey} alt="프로필" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[12px] font-bold text-white">{mem.memNic?.[0] ?? '?'}</span>
                      )}
                    </div>
                    <span className={`text-[14px] font-medium ${selectedMemberId === mem.memId ? 'text-[#3B3EFF]' : 'text-zinc-800'}`}>
                      {mem.memNic}
                    </span>
                    {mem.memRole === 'L' && (
                      <span className="text-[10px] font-semibold text-white bg-[#3B3EFF] rounded-full px-1.5 py-0.5">리더</span>
                    )}
                    {selectedMemberId === mem.memId && (
                      <svg className="ml-auto shrink-0" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#3B3EFF" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* 시작일 / 마감일 */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">미션 시작일</label>
            <input
              type="date"
              className={INPUT_CLS}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">미션 마감일</label>
            <input
              type="date"
              className={INPUT_CLS}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 미션 내용 카드 */}
      <div className="bg-white rounded-xl p-4">
        <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">미션 내용</label>
        <textarea
          className={`${INPUT_CLS} resize-none h-28`}
          placeholder="미션에 대해 자세히 설명해 주세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {/* 등록 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        className="w-full h-[52px] bg-[#3B3EFF] text-white rounded-2xl text-[15px] font-bold disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors mt-2"
      >
        {isSubmitting ? '등록 중...' : '미션 등록'}
      </button>
    </div>
  );
}
