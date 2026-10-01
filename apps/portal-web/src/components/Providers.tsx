'use client';

import React from 'react';
import { ThemeProvider } from '@dommia/ui';

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>;
}
