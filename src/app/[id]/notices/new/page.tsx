'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useHeaderSlotStore } from '@/store/headerSlot';

const INPUT_CLS = 'w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-[14px] text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-[#3B3EFF] transition-colors bg-white';
const SECTION_LABEL = 'text-[13px] font-semibold text-zinc-600 mb-2 block';

function CheckToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
        checked ? 'bg-[#3B3EFF] border-[#3B3EFF]' : 'border-zinc-300 bg-white'
      }`}
    >
      {checked && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

export default function CreateNoticePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();
  const { setPageHeader } = useHeaderSlotStore();

  const [formData, setFormData] = useState({
    notiTitle: '',
    notiContent: '',
    notiFix: 'N',
    notiRequired: 'N',
    teamId: id,
  });

  useEffect(() => {
    setPageHeader({ title: '공지 작성하기', hideHamburger: true });
    return () => setPageHeader(null);
  }, [setPageHeader]);

  const createNoticeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/api/notices', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notices', id] });
      if (data?.data?.notiId) {
        router.push(`/${id}/notices/${data.data.notiId}`);
      } else {
        router.push(`/${id}/notices`);
      }
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || '공지 등록에 실패했습니다.');
    },
  });

  const isDisabled = createNoticeMutation.isPending || !formData.notiTitle.trim() || !formData.notiContent.trim();

  return (
    <div className="-mx-4 -mb-5 min-h-full bg-zinc-100 px-4 pt-5 pb-8 flex flex-col gap-5">

      {/* 제목 + 내용 */}
      <div className="bg-white rounded-xl p-4 flex flex-col gap-4">
        <div>
          <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">제목</label>
          <input
            type="text"
            required
            placeholder="공지사항 제목을 입력하세요"
            className={INPUT_CLS}
            value={formData.notiTitle}
            onChange={(e) => setFormData({ ...formData, notiTitle: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-zinc-500 mb-1.5">내용</label>
          <textarea
            required
            placeholder="공지사항 내용을 상세히 작성해 주세요."
            rows={8}
            className={`${INPUT_CLS} resize-none`}
            value={formData.notiContent}
            onChange={(e) => setFormData({ ...formData, notiContent: e.target.value })}
          />
        </div>
      </div>

      {/* 옵션 */}
      <div className="px-1">
        <label className={SECTION_LABEL}>옵션</label>
        <div className="bg-white rounded-xl divide-y divide-zinc-100">
          <div className="flex items-center justify-between px-4 py-3.5">
            <p className="text-[14px] font-medium text-zinc-800">필독</p>
            <CheckToggle
              checked={formData.notiRequired === 'Y'}
              onChange={() => setFormData({ ...formData, notiRequired: formData.notiRequired === 'Y' ? 'N' : 'Y' })}
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <p className="text-[14px] font-medium text-zinc-800">상단에 고정하기</p>
            <CheckToggle
              checked={formData.notiFix === 'Y'}
              onChange={() => setFormData({ ...formData, notiFix: formData.notiFix === 'Y' ? 'N' : 'Y' })}
            />
          </div>
        </div>
      </div>

      {/* 등록 버튼 */}
      <button
        type="button"
        onClick={() => !isDisabled && createNoticeMutation.mutate(formData)}
        disabled={isDisabled}
        className={`mx-1 text-[15px] font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center ${
          isDisabled ? 'bg-zinc-300 text-white' : 'bg-[#3B3EFF] text-white'
        }`}
      >
        {createNoticeMutation.isPending ? (
          <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          '공지 등록'
        )}
      </button>
    </div>
  );
}