import useSWR, { mutate } from 'swr';
import { Usuario } from '@/types';
import axios, { AxiosError } from 'axios'; 
const API_URL = '/api/users';
const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Error desconocido al obtener usuarios.' }));
        const error = new Error(errorData.message || 'Ocurrió un error al obtener los datos de usuarios.');
        throw error;
    }
    return res.json();
};
function getErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>; 
        return axiosError.response?.data?.message || axiosError.response?.data?.error || axiosError.message || "Error de red o del servidor.";
    } else if (error instanceof Error) {
        return error.message;
    }
    return "Ocurrió un error inesperado.";
}
export function useUsers() {
    const { data, error, isLoading, isValidating } = useSWR<Usuario[]>(API_URL, fetcher);
    const addUserHook = async (formData: FormData): Promise<Usuario> => {
        try {
            const response = await axios.post<Usuario>(API_URL, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            mutate(API_URL); 
            return response.data;
        } catch (err) {
            const message = getErrorMessage(err);
            throw new Error(message);
        }
    };
    const updateUserHook = async (id: string, formData: FormData): Promise<Usuario> => {
        try {
            const response = await axios.put<Usuario>(`${API_URL}/${id}`, formData, {
                 headers: { 'Content-Type': 'multipart/form-data' },
            });
            mutate(API_URL);
            return response.data;
        } catch (err) {
            const message = getErrorMessage(err);
            throw new Error(message);
        }
    };
    const deleteUserHook = async (id: string): Promise<void> => {
        try {
            await axios.delete(`${API_URL}/${id}`);
            mutate(API_URL, (currentData: Usuario[] | undefined) => currentData?.filter((user: Usuario) => user && user.id !== id), false);
        } catch (err) {
            const message = getErrorMessage(err);
            mutate(API_URL); 
            throw new Error(message);
        }
    };
    return {
        users: data,
        isLoadingUsers: isLoading,
        isErrorUsers: error,
        isValidatingUsers: isValidating,
        addUser: addUserHook,
        updateUser: updateUserHook,
        deleteUser: deleteUserHook, 
        mutateUsers: () => mutate(API_URL),
    };
}