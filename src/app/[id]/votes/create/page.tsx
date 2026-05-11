'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHeaderSlotStore } from '@/store/headerSlot';

const INPUT_CLS = 'w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-[14px] text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-[#3B3EFF] transition-colors bg-white';
const SECTION_LABEL = 'text-[13px] font-semibold text-zinc-600 mb-2 block';

type DeadlinePreset = '3일 후' | '5일 후' | '7일 후' | '직접선택';

const today = new Date().toISOString().split('T')[0];

export default function VoteCreatePage() {
  const router = useRouter();
  const { setPageHeader } = useHeaderSlotStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadlinePreset, setDeadlinePreset] = useState<DeadlinePreset>('3일 후');
  const [startDate, setStartDate] = useState(today);
  const [customEndDate, setCustomEndDate] = useState('');
  const [optionType, setOptionType] = useState<'text' | 'date'>('text');
  const [options, setOptions] = useState(['', '']);
  const [multipleChoice, setMultipleChoice] = useState(true);
  const [tieBreaker, setTieBreaker] = useState('재투표 진행');

  const addOption = () => setOptions([...options, '']);
  const removeOption = (idx: number) => setOptions(options.filter((_, i) => i !== idx));
  const updateOption = (idx: number, val: string) =>
    setOptions(options.map((o, i) => (i === idx ? val : o)));
  const switchType = (t: 'text' | 'date') => {
    setOptionType(t);
    setOptions(options.map(() => ''));
  };

  useEffect(() => {
    setPageHeader({ title: '투표 생성하기', hideHamburger: true });
    return () => setPageHeader(null);
  }, [setPageHeader]);

  const filledOptions = options.filter((o) => o.trim() !== '');
  const isDisabled = !title.trim() || filledOptions.length < 2;

  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex flex-col gap-5">

      {/* 제목 + 설명 — 흰 카드 */}
      <div className="bg-white rounded-xl p-4 flex flex-col gap-4">
        <div>
          <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">투표 제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 4월 모임 날짜"
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">
            상세 내용 <span className="text-zinc-300 font-normal">(선택)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="투표에 대한 설명을 입력하세요"
            rows={3}
            className={`${INPUT_CLS} resize-none`}
          />
        </div>
      </div>

      {/* 선택지 */}
      <div className="px-1">
        <div className="flex items-center justify-between mb-2">
          <label className={SECTION_LABEL}>선택지</label>
          <div className="flex items-center gap-0.5 text-[12px]">
            <button
              onClick={() => switchType('text')}
              className={`px-1.5 font-medium ${optionType === 'text' ? 'text-[#3B3EFF]' : 'text-zinc-400'}`}
            >
              텍스트
            </button>
            <span className="text-zinc-300">|</span>
            <button
              onClick={() => switchType('date')}
              className={`px-1.5 font-medium ${optionType === 'date' ? 'text-[#3B3EFF]' : 'text-zinc-400'}`}
            >
              날짜
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {options.map((opt, idx) => (
            <div key={idx} className="relative">
              <input
                type={optionType === 'date' ? 'date' : 'text'}
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
                placeholder={optionType === 'text' ? `선택지 ${idx + 1}` : undefined}
                className={INPUT_CLS}
              />
              {options.length > 2 && (
                <button
                  onClick={() => removeOption(idx)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-400 text-white rounded-full flex items-center justify-center"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addOption}
          className="w-full mt-2 border border-dashed border-zinc-300 rounded-lg py-2.5 text-[13px] text-zinc-400 flex items-center justify-center gap-1.5"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          선택지 추가
        </button>
      </div>

      {/* 투표 기간 */}
      <div className="px-1">
        <label className={SECTION_LABEL}>투표 기간</label>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[12px] text-zinc-400 mb-1.5">시작 일시</p>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <p className="text-[12px] text-zinc-400 mb-2">마감 일시</p>
            <div className="flex gap-2 flex-wrap">
              {(['3일 후', '5일 후', '7일 후', '직접선택'] as DeadlinePreset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setDeadlinePreset(p)}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${
                    deadlinePreset === p
                      ? 'bg-[#3B3EFF] border-[#3B3EFF] text-white'
                      : 'bg-white border-zinc-200 text-zinc-500'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {deadlinePreset === '직접선택' && (
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                min={today}
                className={`${INPUT_CLS} mt-2`}
              />
            )}
          </div>
        </div>
      </div>

      {/* 투표 설정 */}
      <div className="px-1">
        <label className={SECTION_LABEL}>투표 설정</label>
        <div className="bg-white rounded-xl divide-y divide-zinc-100">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-[14px] font-medium text-zinc-800">다중 투표 허용</p>
              <p className="text-[12px] text-zinc-400 mt-0.5">여러 항목 동시 선택 가능</p>
            </div>
            <button
              onClick={() => setMultipleChoice(!multipleChoice)}
              className={`relative w-11 h-6 rounded-full transition-colors ${multipleChoice ? 'bg-[#3B3EFF]' : 'bg-zinc-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${multipleChoice ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <p className="text-[14px] font-medium text-zinc-800">동률 발생 시</p>
            <select
              value={tieBreaker}
              onChange={(e) => setTieBreaker(e.target.value)}
              className="border border-zinc-200 rounded-lg px-2.5 py-1.5 text-[13px] text-zinc-700 outline-none focus:border-[#3B3EFF] bg-white"
            >
              <option>재투표 진행</option>
              <option>팀장 임의 결정</option>
            </select>
          </div>
        </div>
      </div>

      {/* 생성 버튼 */}
      <button
        disabled={isDisabled}
        className={`mx-1 text-[15px] font-semibold py-3.5 rounded-xl transition-colors ${
          isDisabled ? 'bg-zinc-300 text-white' : 'bg-[#3B3EFF] text-white'
        }`}
      >
        투표 생성
      </button>
    </div>
  );
}
