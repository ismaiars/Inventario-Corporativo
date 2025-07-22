'use client';
import React from 'react';
import { SWRConfig } from 'swr';
import { Toaster } from "@/components/ui/toaster"; 
const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) {
        const error = new Error('Ocurrió un error al obtener los datos desde el servidor.');
        throw error; 
    }
    return res.json();
});
/**
 * @param {object} props 
 * @param {React.ReactNode} props.children 
 */
export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SWRConfig value={{
            fetcher: fetcher, 
        }}>
            {children}
            <Toaster />
        </SWRConfig>
    );
}
