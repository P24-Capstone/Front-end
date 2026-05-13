'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useHeaderSlotStore } from '@/store/headerSlot';

const INPUT_CLS = 'w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-[14px] text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-[#3B3EFF] transition-colors bg-white';

export default function MissionNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kind = searchParams.get('kind');
  const isForm = kind === 'form';

  const { setPageHeader } = useHeaderSlotStore();

  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<'공통' | '개인'>('공통');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [content, setContent] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [formItems, setFormItems] = useState(['', '']);

  useEffect(() => {
    setPageHeader({
      title: `미션 생성 · ${isForm ? '자동 폼' : '자유형식'}`,
      hideHamburger: true,
    });
    return () => setPageHeader(null);
  }, [setPageHeader, isForm]);

  const canSubmit = title.trim() && startDate && endDate && content.trim();

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
        <div>
          <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">대상자</label>
          <div className="flex gap-2">
            {(['공통', '개인'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`flex-1 py-2.5 rounded-lg border text-[14px] font-medium transition-colors ${
                  scope === s ? 'bg-[#3B3EFF] border-[#3B3EFF] text-white' : 'border-zinc-200 text-zinc-400 bg-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 시작일 / 마감일 */}
        <div className="grid grid-cols-2 gap-3">
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

      {/* 폼미션 전용 카드 */}
      {isForm && (
        <>
          {/* AI 인증 토글 */}
          <div className="bg-white rounded-xl p-4 flex items-center justify-between">
            <span className="text-[14px] font-semibold text-zinc-800">AI 자동 인증</span>
            <div
              onClick={() => setUseAI(!useAI)}
              className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${useAI ? 'bg-[#3B3EFF]' : 'bg-zinc-300'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${useAI ? 'left-[22px]' : 'left-0.5'}`} />
            </div>
          </div>

          {/* 폼 항목 카드 */}
          <div className="bg-white rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-zinc-500">폼미션 항목</label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => formItems.length > 1 && setFormItems(formItems.slice(0, -1))}
                  className="w-7 h-7 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-500 text-base leading-none"
                >
                  −
                </button>
                <button
                  onClick={() => setFormItems([...formItems, ''])}
                  className="w-7 h-7 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-500 text-base leading-none"
                >
                  +
                </button>
              </div>
            </div>
            {formItems.map((item, i) => (
              <input
                key={i}
                className={INPUT_CLS}
                placeholder={`항목 ${i + 1}`}
                value={item}
                onChange={(e) => {
                  const next = [...formItems];
                  next[i] = e.target.value;
                  setFormItems(next);
                }}
              />
            ))}
          </div>

          {/* 파일 첨부 카드 */}
          <div className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3 text-zinc-400 cursor-pointer active:bg-zinc-50">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            <span className="text-[14px]">파일 첨부</span>
          </div>
        </>
      )}

      {/* 등록 버튼 */}
      <button
        disabled={!canSubmit}
        className="w-full h-[52px] bg-[#3B3EFF] text-white rounded-2xl text-[15px] font-bold disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors mt-2"
      >
        미션 등록
      </button>
    </div>
  );
}