'use client';

import { SessionProvider as NextAuthSessionProvider, useSession } from 'next-auth/react';

export default function SessionProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextAuthSessionProvider>
            {children}
        </NextAuthSessionProvider>
    );
}
