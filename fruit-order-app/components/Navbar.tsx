import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Navbar() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';

  return (
    <nav className="nav">
      <Link href={isAdmin ? '/admin' : '/dashboard'} className="nav-brand">
        🍋 Fresh<span>Market</span>
      </Link>
      <div className="nav-right">
        {session && (
          <>
            <span className="nav-user">
              {isAdmin ? '⚙️ Admin' : `👤 ${session.user?.name}`}
            </span>
            {isAdmin && (
              <Link href="/admin/fruits" style={{ color: '#b7e4c7', fontSize: 13, fontWeight: 500 }}>
                Manage Fruits
              </Link>
            )}
            <button className="nav-btn" onClick={() => signOut({ callbackUrl: '/login' })}>
              Sign out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
