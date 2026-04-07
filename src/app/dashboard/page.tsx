'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getMarketplaceUser } from '@/lib/supabase';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }

    getMarketplaceUser(user.id)
      .then(profile => {
        router.replace(profile.user_type === 'influencer' ? '/dashboard/creator' : '/dashboard/brand');
      })
      .catch(() => router.replace('/dashboard/brand'));
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
