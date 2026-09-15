import { Cormorant_Garamond, Great_Vibes, Instrument_Sans } from 'next/font/google';

export const instrumentSans = Instrument_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  display: 'swap',
});

export const cormorant = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const greatVibes = Great_Vibes({
  variable: '--font-signature',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});
