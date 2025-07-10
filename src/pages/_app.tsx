import { Onest } from 'next/font/google';
import '../styles/globals.css';
import { AppProps } from 'next/app';
import { Toaster } from 'sonner';

const onest = Onest({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={onest.className}>
      <Component {...pageProps} />
      <Toaster
        position="top-center"
        theme='dark'
        className='w-auto max-w-sm'
        richColors
        visibleToasts={1}
      />
    </main>
  );
}
