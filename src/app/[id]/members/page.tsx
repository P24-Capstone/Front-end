const MEMBERS = [
  { id: 1, name: '김민준', role: '모임장', score: 98 },
  { id: 2, name: '이서연', role: '멤버', score: 85 },
  { id: 3, name: '박지훈', role: '멤버', score: 72 },
  { id: 4, name: '나', role: '멤버', score: 60 },
  { id: 5, name: '최수빈', role: '멤버', score: 45 },
];

export default function MembersPage() {
  return (
    <div className="space-y-3">
      <h2 className="text-[15px] font-bold">멤버 ({MEMBERS.length}명)</h2>
      <div className="divide-y divide-zinc-100">
        {MEMBERS.map((m) => (
          <div key={m.id} className="flex items-center gap-3 py-3">
            <div className="w-10 h-10 rounded-full bg-zinc-200 shrink-0 flex items-center justify-center text-[13px] font-medium text-zinc-500">
              {m.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-zinc-900">{m.name}</p>
              <p className="text-[11px] text-zinc-400">{m.role}</p>
            </div>
            <span className="text-[12px] font-semibold text-zinc-700">{m.score}점</span>
          </div>
        ))}
      </div>
    </div>
  );
}
