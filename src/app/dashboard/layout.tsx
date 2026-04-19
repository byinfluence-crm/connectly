import type { Metadata } from 'next';
import DashboardShell from '@/components/DashboardShell';

export const metadata: Metadata = {
  title: 'Dashboard — Connectly',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
