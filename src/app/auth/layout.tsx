import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col">
      <div className="max-w-[390px] mx-auto w-full flex-1 flex flex-col bg-white shadow-sm">
        <header className="px-6 py-4 border-b border-zinc-100">
          <Link href="/" className="text-[18px] font-bold text-zinc-900 tracking-tight">
            Crewise
          </Link>
        </header>
        <main className="flex-1 px-6 py-8">
          {children}
        </main>
        <footer className="px-6 py-4 text-center border-t border-zinc-100">
          <p className="text-[11px] text-zinc-400">Copyright © 2026 Crewise Co. All Rights Reserved</p>
        </footer>
      </div>
    </div>
  );
}
