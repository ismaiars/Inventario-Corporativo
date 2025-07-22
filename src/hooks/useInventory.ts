import useSWR, { mutate } from 'swr';
import { Equipo } from '@/types'; 
import axios from 'axios';
const API_URL = '/api/inventory';
const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) {
        const error = new Error('Ocurrió un error al obtener los datos.');
        throw error;
    }
    return res.json();
});
/**
 * @returns 
 */
export function useInventory() {
    const { data, error, isLoading, isValidating } = useSWR<Equipo[]>(API_URL, fetcher);
    /**
     * @param {FormData} formData 
     * @returns {Promise<Equipo>} 
     * @throws 
     */
    const addItem = async (formData: FormData): Promise<Equipo> => {
        try {
            const response = await axios.post<Equipo>(API_URL, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            mutate(API_URL);
            return response.data;
        } catch (err: any) {
            throw err.response?.data || new Error("Error al agregar el equipo.");
        }
    };

    /**
     * @param {string} id 
     * @param {FormData} formData 
     * @returns {Promise<Equipo>} 
     * @throws 
     */
    const updateItem = async (id: string, formData: FormData): Promise<Equipo> => {
         try {
            const response = await axios.put<Equipo>(`${API_URL}/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            mutate(API_URL);
            return response.data;
        } catch (err: any) {
            throw err.response?.data || new Error("Error al actualizar el equipo.");
        }
    };
    /**
     * @param {string} id 
     * @returns {Promise<void>} 
     * @throws 
     */
    const deleteItem = async (id: string): Promise<void> => {
         try {
            await axios.delete(`${API_URL}/${id}`);
            mutate(API_URL);
        } catch (err: any) {
             throw err.response?.data || new Error("Error al eliminar el equipo.");
        }
    };
    return {
        inventory: data,
        isLoading,
        isError: error,
        isValidating, 
        addItem,
        updateItem,
        deleteItem,
        mutateInventory: () => mutate(API_URL), 
    };
}