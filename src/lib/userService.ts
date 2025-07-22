import fs from 'fs/promises';
import path from 'path';
import { Usuario, UsuarioData, TiposEmpleado, Departamentos } from '@/types';
import { saveImage as saveImageFromInventory } from './inventoryService'; 
import { userMutex } from './lock';
const dataFilePath = path.join(process.cwd(), 'data', 'users.json');
const inventoryDataFilePath = path.join(process.cwd(), 'data', 'inventory.json');
const publicUploadsPath = path.join(process.cwd(), 'public', 'uploads'); 
let userCache: Usuario[] | null = null;
/**
 * @returns {Promise<Usuario[]>} 
 */
export async function readUserData(): Promise<Usuario[]> {
    if (userCache) return userCache;
    try {
        await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
        const jsonData = await fs.readFile(dataFilePath, 'utf-8');
        if (!jsonData.trim()) {
            userCache = [];
            return [];
        }
        const items = JSON.parse(jsonData);
        if (!Array.isArray(items)) {
            userCache = [];
            return [];
        }
        userCache = items as Usuario[];
        return userCache;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            try {
                await fs.writeFile(dataFilePath, '[]', 'utf-8'); 
                userCache = [];
                return [];
            } catch (writeError) {
                userCache = [];
                return [];
            }
        } else if (error instanceof SyntaxError) {
            userCache = [];
            return [];
        }
        userCache = [];
        return [];
    }
}
/**
 * @param {Usuario[]} data 
 * @returns {Promise<void>}
 * @throws 
 */
async function writeUserData(data: Usuario[]): Promise<void> {
    if (!Array.isArray(data)) {
        console.error("writeUserData (users): Intento de escribir datos que no son un array:", data);
        throw new Error("Intento de escritura inválida en users.json (no es un array).");
    }
    await userMutex.runExclusive(async () => {
        const jsonData = JSON.stringify(data, null, 2);
        const tmpPath = `${dataFilePath}.tmp`;
        try {
            await fs.writeFile(tmpPath, jsonData, 'utf-8');
            await fs.rename(tmpPath, dataFilePath);
            userCache = data;
        } catch (error) {
            try { await fs.unlink(tmpPath); } catch {}
            console.error("Error al escribir en users.json:", error);
            throw new Error('No se pudieron escribir los datos de usuarios de forma segura.');
        }
    });
}
async function readInventoryData(): Promise<any[]> {
    try {
        const d = await fs.readFile(inventoryDataFilePath,'utf-8');
        return Array.isArray(JSON.parse(d)) ? JSON.parse(d) : [];
    } catch(e:any){
        if(e.code==='ENOENT') return []; 
        console.error("Err read inv:",e); return[];
    }
}
async function writeInventoryData(data: any[]): Promise<void> {
    try {
        await fs.writeFile(inventoryDataFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error("Err write inv:", e);
    }
}
/**
 * @param tipo 
 * @param depto 
 * @param todosLosUsuarios 
 * @returns 
 */
function generarNuevoIdUsuario(
    tipo: (typeof TiposEmpleado)[number],
    depto: (typeof Departamentos)[number],
    todosLosUsuarios: Usuario[]
): string {
    let prefijo = '';
    let maxNum = 0;
    switch(tipo){
        case 'Jovenes Construyendo el Futuro': prefijo = 'JOV'; break;
        case 'Becarios': prefijo = 'BEC'; break;
        case 'Contratados': prefijo = 'CON'; break;
        default: prefijo = 'UNK'; 
    }
    const inicialesDepto = depto.substring(0, 3).toUpperCase();
    const patronInicio = `${prefijo}-`;
    const patronFin = `-${inicialesDepto}`;
    todosLosUsuarios
        .filter(u => u?.id?.startsWith(patronInicio) && u.id.endsWith(patronFin))
        .forEach(u => {
            const partes = u.id.split('-');
            if (partes.length === 3) { 
                const num = parseInt(partes[1], 10);
                if (!isNaN(num) && num > maxNum) {
                    maxNum = num;
                }
            }
        });
    const siguienteNum = maxNum + 1;
    const numFormateado = String(siguienteNum).padStart(2, '0');
    const nuevoId = `${patronInicio}${numFormateado}${patronFin}`;
    return nuevoId;
}
/**
 * @param {File} file 
 * @returns {Promise<string>} 
 * @throws 
 */
export const saveImage: typeof saveImageFromInventory = async (file) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Tipo de archivo no permitido.');
  }
  return saveImageFromInventory(file);
}; 
/**
 * @returns {Promise<Usuario[]>} 
 */
export async function getAllUsers(): Promise<Usuario[]> {
    try {
        const data = await readUserData();
        if (!Array.isArray(data)) {
             return [];
         }
        return data;
    } catch (error) {
        return []; 
    }
}
/**
 * @param {string} id 
 * @returns {Promise<Usuario | null>} 
 */
export async function getUserById(id: string): Promise<Usuario | null> {
    const data = await readUserData();
    return data.find(item => item?.id === id) || null;
}
/**
 * @param {Omit<Usuario, 'id'>} userData 
 * @returns {Promise<Usuario>}
 * @throws 
 */
export async function addUser(userData: Omit<Usuario, 'id'>): Promise<Usuario> {
    const data = await readUserData(); 
    if (!Array.isArray(data)) {
        throw new Error("No se pudo leer la lista de usuarios existente para añadir uno nuevo.");
    }
    const nuevoId = generarNuevoIdUsuario(userData.tipoEmpleado, userData.departamento, data);
    const newUser: Usuario = { ...(userData as Usuario), id: nuevoId }; 
    data.push(newUser); 
    await writeUserData(data); 
    return newUser; 
}

/**
 * @param {string} id 
 * @param {Partial<Omit<Usuario, 'id'>>} updatedData 
 * @param {File | null | undefined} newImageFile 
 * @param {boolean | undefined} deleteCurrentImage 
 * @returns {Promise<Usuario | null>} 
 * @throws 
 */
export async function updateUser(
    id: string,
    updatedData: Partial<Omit<Usuario, 'id'>>,
    newImageFile?: File | null,
    deleteCurrentImage?: boolean
): Promise<Usuario | null> {
    let data: Usuario[];
    try {
        data = await readUserData();
        if (!Array.isArray(data)) {
            console.error(`Servicio updateUser: readUserData no devolvió un array para ID ${id}.`);
            return null;
        }
    }
    catch (readError) {
        console.error(`Servicio updateUser: Error lectura ID ${id}:`, readError);
        return null;
    }
    const index = data.findIndex(item => item?.id === id);
    if (index === -1) {
        return null;
    }
    const currentUser = data[index];
    if (!currentUser) return null; 
    const currentFotoUrl = currentUser.fotoUrl;
    let finalFotoUrl: string | null = currentUser.fotoUrl ?? null; 
    if (newImageFile) {
        try {
            finalFotoUrl = await saveImage(newImageFile);
            if (currentFotoUrl && currentFotoUrl !== finalFotoUrl) {
                try {
                    await fs.unlink(path.join(process.cwd(), 'public', currentFotoUrl));
                } catch (e: any) {
                    if (e.code !== 'ENOENT') console.error(`Error unlink old user photo [${id}]:`, e);
                }
            }
        } catch (saveError) {
            console.error(`Servicio updateUser [${id}]: Error al guardar nueva imagen:`, saveError);
            finalFotoUrl = currentFotoUrl ?? null;
             throw new Error("No se pudo guardar la nueva imagen, pero otros datos podrían haberse actualizado.");
        }
    } else if (deleteCurrentImage) {
        if (currentFotoUrl) {
            try {
                await fs.unlink(path.join(process.cwd(), 'public', currentFotoUrl));
                console.log(`Servicio updateUser [${id}]: Foto actual ${currentFotoUrl} borrada por petición.`); 
                finalFotoUrl = null; 
            } catch (e: any) {
                if (e.code !== 'ENOENT') {
                     console.error(`Error unlink current user photo [${id}]:`, e);
                     finalFotoUrl = null;
                 } else {
                     finalFotoUrl = null; 
                 }
            }
        } else {
             finalFotoUrl = null;
        }
    }
    const updatedUser: Usuario = {
        ...currentUser,
        ...updatedData, 
        id, 
        fotoUrl: finalFotoUrl, 
    };
    data[index] = updatedUser; 
    try {
        await writeUserData(data);
        return updatedUser;
    }
    catch (writeError) {
        console.error(`Servicio updateUser: Error escritura ${id}:`, writeError);
        throw new Error("Error al guardar los cambios del usuario en el archivo.");
    }
}
/**
 * @param {string} id 
 * @returns {Promise<boolean>} 
 */
export async function deleteUser(id: string): Promise<boolean> {
    let users: Usuario[];
    try {
        users = await readUserData();
        if (!Array.isArray(users)) return false; // Seguridad
    }
    catch (readError) {
        console.error(`Servicio deleteUser: Error lectura ID ${id}:`, readError);
        return false;
    }
    const userIndex = users.findIndex(u => u?.id === id);
    if (userIndex === -1) {
        return false; 
    }
    const userToDelete = users[userIndex];
    const userFotoUrl = userToDelete?.fotoUrl;
    const newData = users.filter(u => u?.id !== id);
    try {
        await writeUserData(newData);
        if (userFotoUrl) {
            try {
                await fs.unlink(path.join(process.cwd(), 'public', userFotoUrl));
            } catch (e: any) {
                if (e.code !== 'ENOENT') {
                    console.error(`Error al borrar foto ${userFotoUrl} del usuario ${id}:`, e);
                } else {
                }
            }
        }
        const inventory = await readInventoryData();
        let inventoryModified = false;
        const updatedInventory = inventory.map(eq => {
            if (eq && eq.usuarioId === id) {
                inventoryModified = true;
                return { ...eq, usuarioId: null }; 
            }
            return eq;
        });
        if (inventoryModified) {
            await writeInventoryData(updatedInventory);
        }
        return true;
    } catch (error) {
        console.error(`Servicio deleteUser: Error durante escritura o procesado para ${id}:`, error);
        return false; 
    }
}