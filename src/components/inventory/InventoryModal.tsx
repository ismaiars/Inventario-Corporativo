'use client';
import React from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Equipo, EstadoEquipo, Usuario } from '@/types';
import { Cpu, HardDrive, MemoryStick, Monitor, Laptop, Server, Info, MapPin, Building, User as UserIcon, Tag, Power, MousePointer, StickyNote, CalendarDays, ShieldCheck, ImageOff } from 'lucide-react'; 
interface InventoryModalProps {
    equipo: Equipo | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: (equipo: Equipo) => void;
    onDelete: (id: string) => void;
    usuario?: Usuario | null;
}
const getStatusVariant = (estado: EstadoEquipo): "default" | "secondary" | "destructive" | "outline" => {
    switch (estado) {
        case EstadoEquipo.EnUso: return "default";
        case EstadoEquipo.Mantenimiento: return "secondary";
        case EstadoEquipo.Obsoleta: return "destructive";
        default: return "secondary";
    }
};
const getStatusText = (estado: EstadoEquipo): string => {
     switch (estado) {
        case EstadoEquipo.EnUso: return "En Uso";
        case EstadoEquipo.Mantenimiento: return "Mantenimiento";
        case EstadoEquipo.Obsoleta: return "Obsoleta";
        default: return "Desconocido";
    }
};
export function InventoryModal({ equipo, isOpen, onClose, onEdit, onDelete, usuario }: InventoryModalProps) {
    if (!equipo) return null;
    const displayName = equipo.nombre || 'Equipo sin nombre';
    const handleDelete = () => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar el equipo "${displayName}"? Esta acción no se puede deshacer.`)) {
            onDelete(equipo.id);
            onClose();
        }
    }
    let displayUsuario = 'No asignado';
    if (usuario) {
        displayUsuario = `${usuario.nombreCompleto} (ID: ${usuario.id})`;
    } else if (equipo.usuarioId) {
        displayUsuario = `ID: ${equipo.usuarioId} (Usuario no encontrado)`;
    }
    const displayDepartamento = usuario ? usuario.departamento : 'N/A';
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{displayName}</DialogTitle>
                    <DialogDescription>Serial: {equipo.serial || 'N/A'}</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 max-h-[70vh] overflow-y-auto p-1 pr-3">
                    {}
                    <div className="space-y-4">
                         <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted/30 flex items-center justify-center">
                             {equipo.fotoUrl ? ( <Image src={equipo.fotoUrl} alt={`Foto de ${displayName}`} fill style={{ objectFit: 'contain' }} sizes="(max-width: 768px) 100vw, 50vw" /> ) : ( <ImageOff className="h-24 w-24 text-muted-foreground/50" aria-label="Sin imagen" /> )}
                        </div>
                        <div className="space-y-3 rounded-md border p-4 bg-card">
                             <h4 className="font-semibold flex items-center text-md mb-2">
                                <Info className="mr-2 h-5 w-5 text-primary"/> Estado
                             </h4>
                             <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground">Estado Actual:</span>
                                <Badge variant={getStatusVariant(equipo.estado)}>{getStatusText(equipo.estado)}</Badge>
                            </div>
                        </div>
                    </div>
                    {}
                    <div className="space-y-1">
                         <Accordion type="multiple" defaultValue={['especificaciones', 'ubicacion', 'detalles']} className="w-full"> {/* Añadido 'detalles' a defaultValue si quieres */}
                            <AccordionItem value="especificaciones">
                                <AccordionTrigger className="text-base font-semibold hover:no-underline"><Cpu className="mr-2 h-5 w-5 text-primary"/> Especificaciones Técnicas</AccordionTrigger>
                                <AccordionContent className="space-y-2 pl-8 text-sm">
                                    <p className="flex items-center"><Cpu className="mr-2 h-4 w-4 text-muted-foreground"/> CPU: {equipo.especificaciones?.cpu || 'N/A'}</p>
                                    <p className="flex items-center"><MemoryStick className="mr-2 h-4 w-4 text-muted-foreground"/> RAM: {equipo.especificaciones?.ram || 'N/A'}</p>
                                    <p className="flex items-center"><HardDrive className="mr-2 h-4 w-4 text-muted-foreground"/> Disco: {equipo.especificaciones?.disco || 'N/A'}</p>
                                    <p className="flex items-center"><Monitor className="mr-2 h-4 w-4 text-muted-foreground"/> Sist. Operativo: {equipo.especificaciones?.so || 'N/A'}</p>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="ubicacion">
                                <AccordionTrigger className="text-base font-semibold hover:no-underline"><MapPin className="mr-2 h-5 w-5 text-primary"/> Ubicación y Asignación</AccordionTrigger>
                                <AccordionContent className="space-y-2 pl-8 text-sm">
                                    <p className="flex items-center"><UserIcon className="mr-2 h-4 w-4 text-muted-foreground"/> Usuario Asignado: {displayUsuario}</p>
                                    <p className="flex items-center"><Building className="mr-2 h-4 w-4 text-muted-foreground"/> Departamento (Usuario): {displayDepartamento}</p>
                                    <p className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground"/> Ubicación Física: {equipo.ubicacion || 'N/A'}</p>
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="detalles">
                                <AccordionTrigger className="text-base font-semibold hover:no-underline"><Tag className="mr-2 h-5 w-5 text-primary"/> Detalles Adicionales</AccordionTrigger>
                                <AccordionContent className="space-y-2 pl-8 text-sm">
                                    <p className="flex items-center"><Laptop className="mr-2 h-4 w-4 text-muted-foreground"/> Tipo Dispositivo: {equipo.detalles?.tipoDispositivo || 'N/A'}</p>
                                    <p className="flex items-center"><MousePointer className="mr-2 h-4 w-4 text-muted-foreground"/> Mouse: {equipo.detalles?.mouse || 'N/A'}</p>
                                    <p className="flex items-center"><Power className="mr-2 h-4 w-4 text-muted-foreground"/> Cargador: {equipo.detalles?.cargador || 'N/A'}</p>
                                    <div className="flex items-start pt-1"><StickyNote className="mr-2 h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0"/><span className="font-medium">Notas:</span></div>
                                    <p className="text-muted-foreground pl-6 whitespace-pre-wrap">{equipo.detalles?.notas || 'Ninguna'}</p>
                                </AccordionContent>
                            </AccordionItem>
                         </Accordion>
                    </div>
                </div>
                <DialogFooter className="mt-6 gap-2 sm:justify-end">
                     <Button variant="outline" onClick={() => onEdit(equipo)}>Editar</Button>
                     <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
                     <DialogClose asChild><Button variant="secondary">Cerrar</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
