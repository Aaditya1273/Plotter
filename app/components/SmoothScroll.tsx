'use client'

import { ReactNode } from 'react'

export default function SmoothScroll({ children }: { children: ReactNode }) {
    // Simple smooth scroll implementation without external dependencies
    return (
        <div style={{ 
            scrollBehavior: 'smooth',
            overflowY: 'auto',
            height: '100%'
        }}>
            {children}
        </div>
    )
}
