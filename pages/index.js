import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from '@supabase/auth-helpers-react';

export default function Home() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      // User is not logged in, show login page
      return;
    }
  }, [session]);

  // Your existing LoginPage or Dashboard component logic here
  return session ? <Dashboard /> : <LoginPage />;
} 