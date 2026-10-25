import type { Metadata } from 'next';
import { StoreProvider } from '@/context/StoreContext';

export const metadata: Metadata = {
  title: 'Store Studio — Sassy & Classy Collections',
  description: 'Sassy & Classy Collections store management workspace.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <StoreProvider scope="admin">{children}</StoreProvider>;
}
