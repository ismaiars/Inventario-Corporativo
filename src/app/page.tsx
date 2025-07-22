'use client';
import React, { useState, useMemo } from 'react';
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { InventoryCard } from '@/components/inventory/InventoryCard';
import { InventoryModal } from '@/components/inventory/InventoryModal';
import { InventoryForm } from '@/components/inventory/InventoryForm';
import { Filters } from '@/components/inventory/Filters';
import { useInventoryPaginated } from '@/hooks/useInventoryPaginated';
import { useInventory } from '@/hooks/useInventory';
import { useUsers } from '@/hooks/useUsers';
import { UserForm } from '@/components/users/UserForm';
import { UserListModal } from '@/components/users/UserListModal';
import { Equipo, Usuario } from '@/types';
import { PlusCircle, Loader2, AlertTriangle, Search as SearchIcon, UserPlus, Users as UsersIcon } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import dynamic from 'next/dynamic';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from 'lucide-react';

const VirtualInventoryGrid = dynamic(() => import('@/components/inventory/VirtualInventoryGrid'), { ssr: false });
const Stats = dynamic(() => import('@/components/inventory/Stats').then(m => m.Stats), {
  ssr: false,
  loading: () => (
    <div className="mb-6 p-4 border rounded-lg bg-card shadow-sm text-center text-muted-foreground">
      Cargando estadísticas…
    </div>
  ),
});

interface FilterState {
  searchTerm: string;
  departamento: string; // 'all' o un valor de departamento
  estado: string;       // 'all' o un valor de EstadoEquipo
  ubicacion: string;    // 'all' o ubicaciones
}

export default function InventoryDashboard() {
    const { data: session } = useSession();
    const { inventory, isLoading, isError, hasMore, loadMore, mutateInventory } = useInventoryPaginated() as any;
    const { addItem, updateItem, deleteItem } = useInventory(); // reutilizar funciones de escritura
    const { users, isLoadingUsers, isErrorUsers, addUser, deleteUser } = useUsers(); 
    const { toast } = useToast();

    const [isInventoryFormModalOpen, setIsInventoryFormModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isUserFormModalOpen, setIsUserFormModalOpen] = useState(false);
    const [isUserListModalOpen, setIsUserListModalOpen] = useState(false);
    const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
    const [isSubmittingInventory, setIsSubmittingInventory] = useState(false);
    const [isSubmittingUser, setIsSubmittingUser] = useState(false);

    const [filters, setFilters] = useState<FilterState>({ searchTerm: '', departamento: 'all', estado: 'all', ubicacion: 'all' });

    const filteredInventory = useMemo(() => {
        if (!Array.isArray(inventory)) return [];
        const userMap = Array.isArray(users) ? new Map(users.map(user => user && user.id ? [user.id, user] : null).filter(Boolean) as [string, Usuario][]) : null;

        return inventory.filter(item => {
            if (!item || typeof item !== 'object' || !item.id) return false;

            const searchTermLower = filters.searchTerm.toLowerCase();
            const assignedUser = item.usuarioId && userMap ? userMap.get(item.usuarioId) : null;
            
            const matchesSearch = !filters.searchTerm ||
                item.nombre?.toLowerCase().includes(searchTermLower) ||
                item.serial?.toLowerCase().includes(searchTermLower) ||
                (assignedUser && assignedUser.nombreCompleto?.toLowerCase().includes(searchTermLower)) ||
                (assignedUser && assignedUser.departamento?.toLowerCase().includes(searchTermLower));
            
            const matchesDepartamento = filters.departamento === 'all' || (assignedUser && assignedUser.departamento === filters.departamento);
            const matchesEstado = filters.estado === 'all' || item.estado === filters.estado;
            const matchesUbicacion = filters.ubicacion === 'all' || item.ubicacion === filters.ubicacion;

            return matchesSearch && matchesDepartamento && matchesEstado && matchesUbicacion;
        });
    }, [inventory, filters, users]);
    
    const handleOpenInventoryFormModal = (equipo: Equipo | null = null) => {
        setSelectedEquipo(equipo);
        setIsDetailsModalOpen(false); setIsUserFormModalOpen(false); setIsUserListModalOpen(false);
        setIsInventoryFormModalOpen(true);
    };
    const handleCloseInventoryFormModal = () => {
        setIsInventoryFormModalOpen(false); setSelectedEquipo(null);
    };

    const handleOpenDetailsModal = (equipo: Equipo) => {
        if (!equipo || !equipo.id) { console.error("Detalles: equipo inválido"); return; }
        setSelectedEquipo(equipo);
        setIsInventoryFormModalOpen(false); setIsUserFormModalOpen(false); setIsUserListModalOpen(false);
        setIsDetailsModalOpen(true);
    };
    const handleCloseDetailsModal = () => {
        setIsDetailsModalOpen(false); setSelectedEquipo(null);
    };

    const handleOpenUserFormModal = () => { 
        setIsUserListModalOpen(false); setIsInventoryFormModalOpen(false); setIsDetailsModalOpen(false);
        setIsUserFormModalOpen(true);
    };
    const handleCloseUserFormModal = () => {
        setIsUserFormModalOpen(false);
    };
    
    const handleOpenUserListModal = () => {
        setIsInventoryFormModalOpen(false); setIsDetailsModalOpen(false); setIsUserFormModalOpen(false);
        setIsUserListModalOpen(true);
    };
    const handleCloseUserListModal = () => {
        setIsUserListModalOpen(false);
    };

    const handleInventoryFormSubmit = async (formData: FormData) => {
        const action = selectedEquipo?.id ? 'actualizar' : 'agregar';
        setIsSubmittingInventory(true);
        try {
             let message = '';
             if (selectedEquipo?.id) {
                 if (!updateItem) throw new Error("updateItem no disponible.");
                 await updateItem(selectedEquipo.id, formData);
                 message = `El equipo "${selectedEquipo.nombre}" se actualizó.`;
             } else {
                 if (!addItem) throw new Error("addItem no disponible.");
                 const newItem = await addItem(formData);
                 message = `El equipo "${(newItem as any)?.nombre || ''}" se agregó.`;
             }
             toast({ title: action === 'actualizar' ? "Equipo actualizado" : "Equipo agregado", description: message });
             handleCloseInventoryFormModal();
        } catch (error: any) {
             toast({ variant: "destructive", title: `Error al ${action}`, description: error?.message || "Ocurrió un error." });
        } finally { setIsSubmittingInventory(false); }
    };

    const handleUserFormSubmit = async (formData: FormData) => {
        setIsSubmittingUser(true);
        try {
            if (!addUser) throw new Error("addUser no disponible.");
            const newUser = await addUser(formData);
            toast({ title: "Usuario agregado", description: `El usuario "${newUser.nombreCompleto}" se agregó.` });
            handleCloseUserFormModal();
        } catch (error: any) {
            toast({ variant: "destructive", title: `Error al agregar usuario`, description: error?.message || "Ocurrió un error." });
        } finally { setIsSubmittingUser(false); }
    };

    const handleDeleteItem = async (id: string) => {
        const equipoNameToDelete = inventory?.find((eq: Equipo | undefined) => eq?.id === id)?.nombre || 'desconocido';
        try {
            if (!deleteItem) throw new Error("deleteItem no disponible.");
            await deleteItem(id);
            toast({ title: "Equipo eliminado", description: `El equipo "${equipoNameToDelete}" ha sido eliminado.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error al eliminar", description: error?.message || `No se pudo eliminar.` });
        }
    };
    
    const showLoadingSkeleton = isLoading; 
    const showStats = !isLoading && !isLoadingUsers && !isError && !isErrorUsers && Array.isArray(inventory) && Array.isArray(users);
    const showStatsLoading = (isLoading || isLoadingUsers) && !isError && !isErrorUsers;
    const showStatsError = isError || isErrorUsers;
    const showInventoryGrid = !isLoading && !isError && Array.isArray(inventory) && filteredInventory.length > 0;
    const showEmptyMessage = !isLoading && !isError && Array.isArray(inventory) && filteredInventory.length === 0;

    const [isDeletingUser, setIsDeletingUser] = useState(false);
    const handleDeleteUser = async (id: string) => {
        if (!id) return;
        const userNameToDelete = users?.find(u => u?.id === id)?.nombreCompleto || 'desconocido';
        if (!window.confirm(`¿Desea dar de baja al usuario "${userNameToDelete}"? Esta acción es irreversible.`)) return;
        try {
            setIsDeletingUser(true);
            if (!deleteUser) throw new Error('deleteUser no disponible.');
            await deleteUser(id);
            toast({ title: 'Usuario eliminado', description: `El usuario "${userNameToDelete}" ha sido dado de baja.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error al eliminar', description: error?.message || 'No se pudo eliminar el usuario.' });
        } finally {
            setIsDeletingUser(false);
        }
    };

     return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Inventario Corporativo</h1>
                <div className="flex items-center gap-4">
                    {session?.user && (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? "Avatar"} />
                                <AvatarFallback>{session.user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">{session.user.name}</span>
                        </div>
                    )}
                    <Button onClick={() => signOut({ callbackUrl: '/login' })} variant="outline" size="icon" aria-label="Cerrar sesión">
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </header>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex-grow"></div>
                <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
                    <Button onClick={handleOpenUserListModal} variant="secondary" disabled={isLoadingUsers || !users}> <UsersIcon className="mr-2 h-4 w-4" /> Ver Usuarios </Button>
                    <Button onClick={handleOpenUserFormModal} variant="outline"> <UserPlus className="mr-2 h-4 w-4" /> Agregar Usuario </Button>
                    <Button onClick={() => handleOpenInventoryFormModal(null)}> <PlusCircle className="mr-2 h-4 w-4" /> Agregar Equipo </Button>
                </div>
            </div>
            
            {showStats && <Stats inventory={inventory} users={users} />}
            {showStatsLoading && <div className="mb-6 p-4 border rounded-lg bg-card shadow-sm text-center text-muted-foreground">Cargando datos...</div>}
            {showStatsError && <div className="mb-6 p-4 border rounded-lg bg-destructive/10 text-destructive text-center">Error al cargar datos para estadísticas. {isError ? '(Inventario)' : ''} {isErrorUsers ? '(Usuarios)' : ''}</div>}
            
            <Filters onFilterChange={setFilters} initialFilters={filters} />
            
            <main className="mt-6">
                {showLoadingSkeleton && ( <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"> {Array.from({ length: 8 }).map((_, index) => ( <Card key={index} className="w-full overflow-hidden"><Skeleton className="aspect-video w-full" /><CardContent className="p-4 space-y-3"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent><CardFooter className="p-4 flex justify-between border-t"><Skeleton className="h-6 w-20" /><Skeleton className="h-6 w-24" /></CardFooter></Card> ))} </div> )}
                
                {isError && !isLoading && ( <div className="text-center py-10 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg"><AlertTriangle className="mx-auto h-12 w-12 text-destructive/70" /><p className="mt-4 font-semibold">Error al cargar el inventario.</p><p className="text-sm text-muted-foreground">({(isError as Error)?.message || 'Error desconocido'})</p><Button onClick={() => mutateInventory()} variant="destructive" className="mt-4">Reintentar Carga</Button></div> )}
                
                {showEmptyMessage && ( <div className="text-center py-10 text-muted-foreground bg-card border border-dashed rounded-lg"><SearchIcon className="mx-auto h-12 w-12 text-muted-foreground/50" /><p className="mt-4 font-semibold">No se encontraron equipos</p><p className="text-sm">{inventory.length > 0 ? 'Pruebe ajustar los filtros.' : 'Agregue un nuevo equipo para comenzar.'}</p></div> )}

                {showInventoryGrid && (
                    <>
                    {filteredInventory.length > 60 ? (
                        <VirtualInventoryGrid items={filteredInventory} onItemClick={handleOpenDetailsModal} />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {filteredInventory.map(equipo => {
                                if (!equipo || !equipo.id) return null;
                                return ( <InventoryCard key={equipo.id} equipo={equipo} onClick={() => handleOpenDetailsModal(equipo)} /> );
                            })}
                        </div>
                    )}
                    
                    {hasMore && (
                        <div className="text-center mt-6">
                            <Button variant="secondary" onClick={() => loadMore()} disabled={isLoading}>{isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando...</>) : 'Cargar más'}</Button>
                        </div>
                    )}
                    </>
                )}
            </main>

            <Dialog open={isInventoryFormModalOpen} onOpenChange={handleCloseInventoryFormModal}>
                <DialogContent className="max-w-3xl sm:max-w-4xl md:max-w-5xl"><DialogHeader><DialogTitle className="text-xl">{selectedEquipo ? 'Editar Equipo' : 'Agregar Nuevo Equipo'}</DialogTitle><DialogDescription>{selectedEquipo ? 'Modifique los detalles.' : 'Complete la información.'}</DialogDescription></DialogHeader><div className="mt-4 max-h-[75vh] overflow-y-auto p-1 pr-3">{isInventoryFormModalOpen && (<InventoryForm key={selectedEquipo?.id || 'new-inventory'} initialData={selectedEquipo} onSubmit={handleInventoryFormSubmit} onCancel={handleCloseInventoryFormModal} isLoading={isSubmittingInventory}/>)}</div></DialogContent>
            </Dialog>

            {isDetailsModalOpen && selectedEquipo && ( <InventoryModal equipo={selectedEquipo} isOpen={isDetailsModalOpen} onClose={handleCloseDetailsModal} onEdit={handleOpenInventoryFormModal} onDelete={handleDeleteItem} usuario={users?.find(u => u.id === selectedEquipo.usuarioId)} /> )}

            <Dialog open={isUserFormModalOpen} onOpenChange={handleCloseUserFormModal}>
                <DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="text-xl">Agregar Nuevo Usuario</DialogTitle><DialogDescription>Complete la información del nuevo usuario.</DialogDescription></DialogHeader><div className="mt-4">{isUserFormModalOpen && (<UserForm key="new-user-form" onSubmit={handleUserFormSubmit} onCancel={handleCloseUserFormModal} isLoading={isSubmittingUser}/>)}</div></DialogContent>
            </Dialog>
            
            <Dialog open={isUserListModalOpen} onOpenChange={handleCloseUserListModal}>
                <UserListModal users={users || []} isOpen={isUserListModalOpen} onClose={handleCloseUserListModal} isLoading={isLoadingUsers} onDelete={handleDeleteUser} isDeleting={isDeletingUser} />
            </Dialog>
        </div>
    );
}
