import fs from 'fs/promises';
import path from 'path';
import { Equipo, EquipoData, Usuario, Departamentos } from '@/types';
import { v4 as uuidv4 } from 'uuid'; 
import { readUserData } from './userService';
import { inventoryMutex } from './lock';
const dataFilePath = path.join(process.cwd(), 'data', 'inventory.json');
const publicUploadsPath = path.join(process.cwd(), 'public', 'uploads'); 
let inventoryCache: Equipo[] | null = null;
/**
 * @returns {Promise<Equipo[]>}
 */
async function readData(): Promise<Equipo[]> {
    if (inventoryCache) {
        return inventoryCache;
    }
    try {
        await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
        const jsonData = await fs.readFile(dataFilePath, 'utf-8');
        if (!jsonData.trim()) {
            inventoryCache = [];
            return [];
        }
        const items = JSON.parse(jsonData);
        if (!Array.isArray(items)) {
            inventoryCache = [];
            return [];
        }
        inventoryCache = items as Equipo[];
        return inventoryCache;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            try {
                await fs.writeFile(dataFilePath, '[]', 'utf-8');
            } catch (writeError) {
            }
            inventoryCache = [];
            return [];
        }
        else if (error instanceof SyntaxError) {
            inventoryCache = [];
            return [];
        }
        inventoryCache = [];
        return [];
    }
}

/**
 * @param {Equipo[]} data 
 * @returns {Promise<void>}
 * @throws 
 */
async function writeData(data: Equipo[]): Promise<void> {
    if (!Array.isArray(data)) {
        throw new Error("Intento de escritura inválida en inventory.json (no es un array).");
    }
    await inventoryMutex.runExclusive(async () => {
        const jsonData = JSON.stringify(data, null, 2);
        const tmpPath = `${dataFilePath}.tmp`;
        try {
            // Escribimos primero en archivo temporal
            await fs.writeFile(tmpPath, jsonData, 'utf-8');
            // Renombramos (operación atómica en la mayoría de SO)
            await fs.rename(tmpPath, dataFilePath);
            inventoryCache = data; // actualizar caché
        } catch (error) {
            // Limpieza temporal si algo falla
            try { await fs.unlink(tmpPath); } catch {}
            throw new Error('No se pudieron escribir los datos de inventario de forma segura.');
        }
    });
}
/**
 * @param depto 
 * @param inventarioActual 
 * @returns 
 */
function generarNuevoSerialEquipo(
    depto: (typeof Departamentos)[number] | null | undefined,
    inventarioActual: Equipo[]
): string {
    // Si no hay departamento, usa GEN
    const deptName = depto ?? 'GEN';

    // Buscar el número máximo existente para este departamento en ambos formatos
    let maxNum = 0;

    const regexNew = new RegExp(`^${deptName} (\\d+)$`, 'i');
    const regexOld = new RegExp(`^${deptName.substring(0, 3).toUpperCase()}-(\\d+)$`, 'i');

    inventarioActual.forEach(eq => {
        const serial = eq?.serial;
        if (!serial) return;

        let match = serial.match(regexNew);
        if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
            return;
        }
        match = serial.match(regexOld);
        if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
        }
    });

    const siguienteNum = maxNum + 1;
    return `${deptName} ${siguienteNum}`;
}

/**
 * Reemplaza los seriales que empiezan con GEN- por un prefijo basado en el departamento del usuario asignado.
 * @param items Inventario en memoria
 * @param users Lista de usuarios
 * @returns true si hubo cambios
 */
function fixGenericSerials(items: Equipo[], users: Usuario[]): boolean {
    if (!Array.isArray(items) || !Array.isArray(users)) return false;

    // Mapa depto -> número máximo existente (en nuevo formato)
    const maxByDept = new Map<string, number>();

    // Inicializar con seriales actuales que NO son GEN y ya están en formato nuevo
    items.forEach(eq => {
        const match = eq?.serial?.match(/^(.+) (\d+)$/);
        if (match) {
            const dept = match[1];
            const num = parseInt(match[2], 10);
            if (!isNaN(num)) {
                const currentMax = maxByDept.get(dept) || 0;
                if (num > currentMax) maxByDept.set(dept, num);
            }
        }
    });

    const userMap = new Map(users.map(u => [u.id, u]));
    let changed = false;

    items.forEach(eq => {
        if (!eq?.serial?.startsWith('GEN')) return;
        if (!eq?.usuarioId) return;
        const user = userMap.get(eq.usuarioId);
        const depto = user?.departamento;
        if (!depto) return;
        let nextNum = (maxByDept.get(depto) || 0) + 1;
        maxByDept.set(depto, nextNum);
        eq.serial = `${depto} ${nextNum}`;
        changed = true;
    });

    return changed;
}
/**
 * @param {File} file 
 * @returns {Promise<string>} 
 * @throws 
 */
export { generarNuevoSerialEquipo }; // export for tests

export async function saveImage(file: File): Promise<string> {
    try {
        await fs.mkdir(publicUploadsPath, { recursive: true });
        // validar tipo mime basico
        if (!file.type.startsWith('image/')) {
            throw new Error('Tipo de archivo no permitido.');
        }
        const timestamp = Date.now();
        const uniqueFilename = `${timestamp}-${file.name.replace(/\s+/g, '_')}`; 
        const filePath = path.join(publicUploadsPath, uniqueFilename);
        const fileUrl = `/uploads/${uniqueFilename}`; 
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await fs.writeFile(filePath, buffer);
        return fileUrl; 
    } catch (error) {
        throw new Error("No se pudo guardar la imagen.");
    }
}
// Mapea prefijos de 3 letras a nombres completos de departamento
const PREFIX_TO_DEPT: Record<string, (typeof Departamentos)[number] | undefined> = {
  'SIS': 'Sistemas',
  'ÓPT': 'Óptica',
  'OPT': 'Óptica',
  'CER': 'Certificaciones',
  'VEN': 'Ventas',
  'MAR': 'Marketing',
};

// Convierte seriales con formato "ABC-01" a "Departamento N"
function migrateOldSerials(items: Equipo[]): boolean {
  let changed = false;
  items.forEach(eq => {
    const match = eq?.serial?.match(/^([A-ZÁÉÍÓÚÑ]{3})-(\d{2})$/i);
    if (!match) return;
    const pref = match[1].toUpperCase();
    const num = parseInt(match[2], 10);
    const dept = PREFIX_TO_DEPT[pref];
    if (!dept || isNaN(num)) return;
    eq.serial = `${dept} ${num}`;
    changed = true;
  });
  return changed;
}
/**
 * @returns {Promise<Equipo[]>} 
 */
export async function getAllInventory(): Promise<Equipo[]> {
    try {
        let data = await readData();
        if (!Array.isArray(data)) {
            return [];
        }
        const users = await readUserData();
        let updated = false;
        if (migrateOldSerials(data)) updated = true;
        if (fixGenericSerials(data, users)) updated = true;
        if (updated) {
            // Persistir los cambios
            await writeData(data);
        }
        return data;
    } catch (error) {
        return []; 
    }
}
/**
 * @param {string} id 
 * @returns {Promise<Equipo | null>} 
 */
export async function getInventoryById(id: string): Promise<Equipo | null> {
    const data = await readData();
    return data.find(item => item?.id === id) || null;
}
/**
 * @param {Omit<Equipo, 'id' | 'serial'>} itemData 
 * @returns {Promise<Equipo>} 
 * @throws 
 */
export async function addInventoryItem(itemData: Omit<Equipo, 'id' | 'serial'>): Promise<Equipo> {
    const inventario = await readData(); 
    if (!Array.isArray(inventario)) {
        throw new Error("No se pudo leer el inventario existente para añadir el nuevo equipo.");
    }
    const users = await readUserData(); 
    if (!Array.isArray(users)) {
        console.warn("Servicio addInventoryItem: No se pudo leer usuarios para generar serial. Se usará prefijo 'GEN'.");
    }
    const usuarioAsignado = itemData.usuarioId ? users.find(u => u.id === itemData.usuarioId) : null;
    const departamentoUsuario = usuarioAsignado?.departamento; 
    const nuevoSerial = generarNuevoSerialEquipo(departamentoUsuario, inventario);
    const newItem: Equipo = {
        ...(itemData as Equipo), 
        id: uuidv4(),         
        serial: nuevoSerial,   
    };
    inventario.push(newItem); 
    await writeData(inventario); 
    return newItem; 
}
/**
 * @param {string} id 
 * @param {Partial<Omit<Equipo, 'id' | 'serial'>>} updatedData 
 * @returns {Promise<Equipo | null>} 
 * @throws 
 */
export async function updateInventoryItem(id: string, updatedData: Partial<Omit<Equipo, 'id' | 'serial'>>): Promise<Equipo | null> {
    const data = await readData();
    if (!Array.isArray(data)) { return null; } 
    const index = data.findIndex(item => item?.id === id);
    if (index === -1) {
        return null; 
    }
    const currentItem = data[index];
    if (!currentItem) return null; 
    const updatedItem: Equipo = {
        ...currentItem,
        ...(updatedData as Partial<Equipo>),
        id: currentItem.id,
        serial: currentItem.serial,
    };

    data[index] = updatedItem; 
    await writeData(data); 
    return updatedItem; 
}

/**
 * @param {string} id 
 * @returns {Promise<boolean>} 
 */
export async function deleteInventoryItem(id: string): Promise<boolean> {
    let data = await readData();
    if (!Array.isArray(data)) { return false; }
    const itemIndex = data.findIndex(item => item?.id === id);
    if (itemIndex === -1) {
        return false; 
    }
    const itemToDelete = data[itemIndex];
    const fotoUrlToDelete = itemToDelete?.fotoUrl;
    const newData = data.filter(item => item.id !== id);
    try {
        await writeData(newData);
        if (fotoUrlToDelete) {
            try {
                const imagePath = path.join(process.cwd(), 'public', fotoUrlToDelete);
                await fs.unlink(imagePath); 
            } catch (unlinkError: any) {
                if (unlinkError.code !== 'ENOENT') {
                } else {
                }
            }
        }
        return true; 
    } catch (error) {
        return false; 
    }
}
