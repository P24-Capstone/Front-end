'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MINUTE_DETAILS, ScriptEntry } from '../_data';
import { useHeaderSlotStore } from '@/store/headerSlot';

type TabType = '요약' | '스크립트' | '정보';

const SPEAKER_COLORS = [
  { bg: '#3B3EFF', text: '#fff' },
  { bg: '#FF9E6A', text: '#fff' },
  { bg: '#57B37A', text: '#fff' },
  { bg: '#E5638C', text: '#fff' },
  { bg: '#31DBD5', text: '#fff' },
];

function getSpeakerColor(index: number) {
  return SPEAKER_COLORS[(index - 1) % SPEAKER_COLORS.length];
}

function SpeakerBadge({ index, name, wrap = false }: { index: number; name: string; wrap?: boolean }) {
  const { bg, text } = getSpeakerColor(index);
  return (
    <span
      className={`text-[11px] font-semibold px-2 py-0.5 inline-block ${wrap ? 'rounded-full break-all' : 'rounded-full shrink-0'}`}
      style={{ backgroundColor: bg, color: text }}
    >
      {name}
    </span>
  );
}

function EditableSpeakerBadge({
  index, name, editable, onRename,
}: { index: number; name: string; editable: boolean; onRename: (name: string) => void }) {
  const { bg, text } = getSpeakerColor(index);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setValue(name); }, [name]);

  function commit() {
    const trimmed = value.trim();
    if (trimmed) onRename(trimmed);
    else setValue(name);
    setIsEditing(false);
  }

  if (editable && isEditing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setValue(name); setIsEditing(false); }
        }}
        className="text-[11px] font-semibold px-2 py-0.5 rounded-full outline-none w-16 text-center"
        style={{ backgroundColor: bg, color: text }}
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={() => { if (editable) { setValue(name); setIsEditing(true); } }}
      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${editable ? '' : 'cursor-default'}`}
      style={{ backgroundColor: bg, color: text }}
    >
      {name}
    </button>
  );
}

const isLeader = true; // TODO: from auth

export default function MinuteDetailPage() {
  const { minuteId } = useParams<{ minuteId: string }>();
  const [tab, setTab] = useState<TabType>('요약');
  const [editing, setEditing] = useState(false);
  const { setEditSlot } = useHeaderSlotStore();

  const minute = MINUTE_DETAILS[minuteId];

  const initSpeakers = minute
    ? [...new Set(minute.script.map((e) => e.speaker))].sort((a, b) => a - b)
    : [];

  const [titleEdit, setTitleEdit] = useState(minute?.title ?? '');
  const [hashTagsEdit, setHashTagsEdit] = useState<string[]>(minute?.hashTags ?? []);
  const [hashTagInput, setHashTagInput] = useState('');
  const [contentEdit, setContentEdit] = useState<string>(
    [minute?.summary ?? '', ...(minute?.keyPoints ?? [])].filter(Boolean).join('\n\n')
  );
  const [scriptEdit, setScriptEdit] = useState<ScriptEntry[]>(minute?.script ?? []);
  const [speakersEdit, setSpeakersEdit] = useState<number[]>(initSpeakers);
  const [speakerNames, setSpeakerNames] = useState<Record<number, string>>(() =>
    Object.fromEntries(initSpeakers.map((n) => [n, `화자${n}`]))
  );
  const [speakerSelectorEntry, setSpeakerSelectorEntry] = useState<number | null>(null);

  function rename(speaker: number, name: string) {
    setSpeakerNames((prev) => ({ ...prev, [speaker]: name }));
  }

  function addSpeaker() {
    const next = speakersEdit.length > 0 ? Math.max(...speakersEdit) + 1 : 1;
    setSpeakersEdit((prev) => [...prev, next]);
    setSpeakerNames((prev) => ({ ...prev, [next]: `화자${next}` }));
  }

  function deleteSpeaker(speaker: number) {
    setSpeakersEdit((prev) => prev.filter((n) => n !== speaker));
    setSpeakerNames((prev) => { const next = { ...prev }; delete next[speaker]; return next; });
  }

  function addHashTag(raw: string) {
    const tag = raw.replace(/^#+/, '').trim();
    if (tag) setHashTagsEdit((prev) => prev.includes(tag) ? prev : [...prev, tag]);
    setHashTagInput('');
  }

  function cancelEdit() {
    setTitleEdit(minute?.title ?? '');
    setHashTagsEdit(minute?.hashTags ?? []);
    setHashTagInput('');
    setContentEdit([minute?.summary ?? '', ...(minute?.keyPoints ?? [])].filter(Boolean).join('\n\n'));
    setScriptEdit(minute?.script ?? []);
    setSpeakersEdit(initSpeakers);
    setSpeakerNames(Object.fromEntries(initSpeakers.map((n) => [n, `화자${n}`])));
    setEditing(false);
  }

  useEffect(() => {
    if (!isLeader) return;
    setEditSlot({
      editing,
      onEdit: () => setEditing(true),
      onSave: () => setEditing(false),
      onCancel: cancelEdit,
    });
    return () => setEditSlot(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  if (!minute) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[14px] text-zinc-400">회의록을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full" onClick={() => setSpeakerSelectorEntry(null)}>
      {/* 제목 · 날짜 */}
      <div className="pt-5 pb-4">
        {editing ? (
          <input
            value={titleEdit}
            onChange={(e) => setTitleEdit(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="text-[17px] font-bold text-zinc-900 leading-snug w-full border border-zinc-300 rounded-lg px-3 py-1.5 outline-none focus:border-[#3B3EFF] mb-3"
          />
        ) : (
          <h1 className="text-[17px] font-bold text-zinc-900 leading-snug mb-3">{titleEdit}</h1>
        )}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span className="text-[12px] text-zinc-400">{minute.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
              <circle cx="12" cy="12" r="9" strokeLinecap="round" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
            </svg>
            <span className="text-[12px] text-zinc-400">{minute.duration}</span>
          </div>
        </div>
      </div>

      {/* 탭바 */}
      <div className="flex border-t border-b border-zinc-200 -mx-4 sticky top-0 z-10 bg-white">
        {(['요약', '스크립트', '정보'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex justify-center text-[13px] font-medium transition-colors ${tab === t ? 'text-zinc-900' : 'text-zinc-400'}`}
          >
            <span className={`inline-block py-2.5 -mb-px ${tab === t ? 'border-b-2 border-zinc-900' : ''}`}>
              {t}
            </span>
          </button>
        ))}
      </div>

      {/* 요약 */}
      {tab === '요약' && (
        <div className="flex-1 -mx-4 -mb-5 bg-[#EBEBFF] px-4 pt-4 pb-8 flex flex-col gap-3">
          {/* 박스 1: 해시태그 */}
          <div className="bg-white rounded-xl px-4 py-3">
            {editing ? (
              <div className="flex flex-wrap gap-1.5">
                {hashTagsEdit.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-[12px] font-semibold text-white bg-[#3B3EFF] pl-2.5 pr-1.5 py-0.5 rounded-full">
                    #{tag}
                    <button
                      onClick={() => setHashTagsEdit((prev) => prev.filter((t) => t !== tag))}
                      className="w-3.5 h-3.5 rounded-full bg-white/30 flex items-center justify-center shrink-0"
                    >
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                        <path d="M2 2l6 6M8 2L2 8" />
                      </svg>
                    </button>
                  </span>
                ))}
                <input
                  value={hashTagInput}
                  onChange={(e) => setHashTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && hashTagInput.trim()) {
                      e.preventDefault();
                      addHashTag(hashTagInput);
                    }
                    if (e.key === 'Backspace' && !hashTagInput && hashTagsEdit.length > 0) {
                      setHashTagsEdit((prev) => prev.slice(0, -1));
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={hashTagsEdit.length === 0 ? '#태그 입력 후 Enter' : ''}
                  className="text-[12px] text-zinc-700 outline-none min-w-[100px] flex-1 placeholder:text-zinc-300"
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {hashTagsEdit.map((tag) => (
                  <span key={tag} className="text-[12px] font-semibold text-white bg-[#3B3EFF] px-2.5 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 박스 2: 내용 */}
          <div className="bg-white rounded-xl p-4">
            {editing ? (
              <textarea
                value={contentEdit}
                onChange={(e) => setContentEdit(e.target.value)}
                ref={(el) => {
                  if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
                }}
                onClick={(e) => e.stopPropagation()}
                rows={6}
                className="w-full text-[14px] text-zinc-700 leading-relaxed border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-[#3B3EFF] resize-none"
              />
            ) : (
              <div>
                {contentEdit.split('\n').map((line, i) => (
                  <p key={i} className={`text-[14px] text-zinc-700 leading-relaxed ${line === '' ? 'mt-2' : ''}`}>{line}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 스크립트 */}
      {tab === '스크립트' && (
        <div className="flex-1 -mx-4 -mb-5 bg-[#EBEBFF] px-4 pt-4 pb-8">
          <div className="bg-white rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-medium text-zinc-500">참여한 사람</p>
              <p className="text-[11px] text-zinc-400">눌러서 이름 변경</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {speakersEdit.map((n) => (
                <div key={n} className="relative inline-flex">
                  <EditableSpeakerBadge
                    index={n}
                    name={speakerNames[n] ?? `화자${n}`}
                    editable={true}
                    onRename={(name) => rename(n, name)}
                  />
                  {editing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSpeaker(n); }}
                      className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-zinc-400 text-white rounded-full flex items-center justify-center"
                    >
                      <svg width="6" height="6" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                        <path d="M2 2l6 6M8 2L2 8" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              {editing && (
                <button
                  onClick={(e) => { e.stopPropagation(); addSpeaker(); }}
                  className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-zinc-300 text-zinc-500"
                >
                  +추가
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl overflow-visible">
            {scriptEdit.map((entry, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 px-4 py-3 ${i < scriptEdit.length - 1 ? 'border-b border-zinc-50' : ''}`}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[11px] text-zinc-300 font-mono mt-0.5 shrink-0 w-9">{entry.time}</span>
                <div className="w-[50px] shrink-0 relative">
                  {editing ? (
                    <>
                      <button
                        onClick={() => setSpeakerSelectorEntry(speakerSelectorEntry === i ? null : i)}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full break-all"
                        style={{ backgroundColor: getSpeakerColor(entry.speaker).bg, color: getSpeakerColor(entry.speaker).text }}
                      >
                        {speakerNames[entry.speaker] ?? `화자${entry.speaker}`}
                      </button>
                      {speakerSelectorEntry === i && (
                        <div className="absolute top-full left-0 z-30 mt-1 bg-white rounded-xl shadow-lg border border-zinc-100 min-w-[96px] overflow-hidden">
                          {speakersEdit.map((n) => (
                            <button
                              key={n}
                              onClick={() => {
                                const next = [...scriptEdit];
                                next[i] = { ...next[i], speaker: n };
                                setScriptEdit(next);
                                setSpeakerSelectorEntry(null);
                              }}
                              className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-zinc-50"
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: getSpeakerColor(n).bg }}
                              />
                              <span className="text-[12px] text-zinc-700">{speakerNames[n] ?? `화자${n}`}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <SpeakerBadge index={entry.speaker} name={speakerNames[entry.speaker] ?? `화자${entry.speaker}`} wrap />
                  )}
                </div>
                {editing ? (
                  <textarea
                    value={entry.text}
                    ref={(el) => {
                      if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
                    }}
                    onChange={(e) => {
                      const next = [...scriptEdit];
                      next[i] = { ...next[i], text: e.target.value };
                      setScriptEdit(next);
                      e.currentTarget.style.height = 'auto';
                      e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                    }}
                    rows={1}
                    className="text-[13px] text-zinc-700 flex-1 border border-zinc-200 rounded-lg px-2 py-1 outline-none focus:border-[#3B3EFF] resize-none overflow-hidden"
                    style={{ minHeight: '28px' }}
                  />
                ) : (
                  <p className="text-[13px] text-zinc-700 leading-relaxed flex-1">{entry.text}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 정보 */}
      {tab === '정보' && (
        <div className="flex-1 -mx-4 -mb-5 bg-[#EBEBFF] px-4 pt-4 pb-8">
          <div className="bg-white rounded-xl overflow-hidden">
            {[
              { label: '생성자', value: minute.info.creator },
              { label: '생성일시', value: minute.info.createdAt },
              { label: '음성파일', value: minute.info.audioFile },
              { label: '파일 길이', value: minute.info.fileLength },
              { label: '파일 크기', value: minute.info.fileSize },
            ].map(({ label, value }, i, arr) => (
              <div key={label} className={`flex items-center justify-between px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-zinc-50' : ''}`}>
                <span className="text-[13px] text-zinc-400">{label}</span>
                <span className="text-[13px] font-medium text-zinc-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}