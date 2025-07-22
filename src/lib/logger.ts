import pino from 'pino';

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime
});

// Mapear consola a logger (solo métodos existentes)
console.log = (...args: any[]) => (logger as any).info(...args);
console.info = (...args: any[]) => (logger as any).info(...args);
console.warn = (...args: any[]) => (logger as any).warn(...args);
console.error = (...args: any[]) => (logger as any).error(...args);
console.debug = (...args: any[]) => (logger as any).debug(...args);

export default logger; 