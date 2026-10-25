import type { Metadata } from 'next';
import { StoreProvider } from '@/context/StoreContext';

export const metadata: Metadata = {
  title: 'Sassy & Classy Collections — Your Style. Your Statement.',
  description:
    'Discover the finishing touches that make every look unforgettable at Sassy & Classy Collections.',
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
}
