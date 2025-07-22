'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error('Error capturado por ErrorBoundary:', error);
  }, [error]);

  return (
    <html>
      <body className="h-screen flex flex-col items-center justify-center bg-destructive/10 text-destructive">
        <h2 className="text-2xl font-bold mb-2">Algo salió mal</h2>
        <p className="mb-4 text-center max-w-md">{error.message || 'Ha ocurrido un error inesperado.'}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
        >
          Reintentar
        </button>
        <button
          onClick={() => router.back()}
          className="mt-3 text-sm underline text-muted-foreground"
        >
          Volver
        </button>
      </body>
    </html>
  );
} 