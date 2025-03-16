import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from '@supabase/auth-helpers-react';
import Dashboard from '../src/components/Dashboard';
import LoginPage from '../src/components/LoginPage';

export default function Home() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      // User is not logged in, show login page
      return;
    }
  }, [session]);

  return session ? <Dashboard /> : <LoginPage />;
} 