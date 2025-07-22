import '@/lib/logger';
import { Mutex } from 'async-mutex';

// Mutex global para operaciones de inventario
export const inventoryMutex = new Mutex();

// Mutex global para operaciones de usuarios
export const userMutex = new Mutex(); 