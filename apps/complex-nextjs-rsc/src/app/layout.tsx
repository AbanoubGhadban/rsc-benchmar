import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'RSC Shop - E-commerce Benchmark',
  description: 'Full-featured e-commerce built with React Server Components',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
