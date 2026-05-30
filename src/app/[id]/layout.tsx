import GroupHeader from './_components/GroupHeader';
import GroupNav from './_components/GroupNav';

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="w-full h-screen bg-white flex flex-col max-w-[390px] mx-auto shadow-sm overflow-hidden">
      <GroupHeader />
      <GroupNav groupId={id} />
      <main className="flex-1 overflow-y-auto px-4 pt-0 pb-5 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
        {children}
      </main>
      <footer className="py-3 px-4 border-t border-zinc-100 text-center">
        <p className="text-[11px] text-zinc-400">© 2026 Crewise Corp. All Rights Reserved</p>
      </footer>
    </div>
  );
}
