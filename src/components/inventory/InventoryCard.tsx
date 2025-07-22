'use client';
import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Equipo, EstadoEquipo, Usuario } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import { Cpu, HardDrive, MemoryStick, Monitor, Laptop, Server, User as UserIcon, ImageOff, ShieldCheck, ShieldOff, Info, Activity } from 'lucide-react'; 
interface InventoryCardProps {
    equipo: Equipo;
    onClick: () => void;
}
const getStatusVariant = (estado: EstadoEquipo | undefined | null): "default" | "secondary" | "destructive" | "outline" => {
    if (!estado) return "secondary";
    switch (estado) {
        case EstadoEquipo.EnUso: return "default";
        case EstadoEquipo.Mantenimiento: return "secondary";
        case EstadoEquipo.Obsoleta: return "destructive";
        default: return "secondary";
    }
};
const getStatusText = (estado: EstadoEquipo | undefined | null): string => {
    if (!estado) return "Desconocido";
    switch (estado) {
        case EstadoEquipo.EnUso: return "En Uso";
        case EstadoEquipo.Mantenimiento: return "Mantenimiento";
        case EstadoEquipo.Obsoleta: return "Obsoleta";
        default: return "Desconocido";
    }
};
const getDeviceIcon = (equipo: Equipo): React.ReactNode => {
  return null;
};
export function InventoryCard({ equipo, onClick }: InventoryCardProps) {
    if (!equipo) return null;
    const displayName = equipo.nombre || 'Equipo sin nombre';
    const placeholderImage = `https://via.placeholder.com/300x200.png?text=${encodeURIComponent(displayName)}`;
    const displayUsuario = equipo.usuarioId ? `Asignado` : 'Sin asignar';
    return (
        <Card
            className="w-full overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col"
            onClick={onClick}
        >
            <CardHeader className="p-0 relative aspect-video bg-muted/30 flex items-center justify-center">
                 {equipo.fotoUrl ? (
                   <Image
                     src={equipo.fotoUrl}
                     alt={`Foto de ${displayName}`}
                     fill
                     style={{ objectFit: 'cover' }}
                     sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                     placeholder="blur"
                     blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8+B8AAusB9YpP67sAAAAASUVORK5CYII="
                     priority={false}
                     onError={(e) => {
                       e.currentTarget.src = placeholderImage;
                       (e.target as HTMLImageElement).srcset = placeholderImage;
                     }}
                   />
                 ) : (
                   <ImageOff className="h-16 w-16 text-muted-foreground/50" aria-label="Sin imagen" />
                 )}
            </CardHeader>
            <CardContent className="p-4 flex-grow space-y-2">
                <div className="flex justify-between items-start mb-1">
                     <CardTitle className="text-lg font-semibold leading-tight">{displayName}</CardTitle>
                     {getDeviceIcon(equipo)}
                </div>
                <p className="text-sm text-muted-foreground">Serial: {equipo.serial || 'N/A'}</p>
                <div className="flex items-center space-x-2 text-sm pt-1">
                    <UserIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{displayUsuario}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm pt-1">
                    <Activity className="h-4 w-4 text-muted-foreground flex-shrink-0" /> 
                    <Badge variant={getStatusVariant(equipo.estado)} className="text-xs px-1.5 py-0.5"> 
                        {getStatusText(equipo.estado)}
                    </Badge>
                </div>
                 <div className="flex items-center space-x-2 text-sm pt-1">
                     <TooltipProvider delayDuration={100}>
                         <Tooltip>
                             <TooltipTrigger asChild>
                                 <button type="button" className="flex items-center p-0 bg-transparent border-none cursor-help">
                                     {equipo.tieneGarantia ? (
                                         <ShieldCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                                     ) : (
                                         <ShieldOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                     )}
                                 </button>
                             </TooltipTrigger>
                             <TooltipContent side="top">
                                 {equipo.tieneGarantia ? (
                                     <p className="max-w-xs">{equipo.detallesGarantia || "Garantía activa (sin detalles)"}</p>
                                 ) : (
                                     <p>Sin garantía</p>
                                 )}
                             </TooltipContent>
                         </Tooltip>
                     </TooltipProvider>
                     <span className={`text-sm font-medium ${equipo.tieneGarantia ? 'text-green-700' : 'text-muted-foreground'}`}>
                         {equipo.tieneGarantia ? 'Con Garantía' : 'Sin Garantía'}
                     </span>
                 </div>
                <div className="flex items-center space-x-2 text-sm pt-1"> 
                    <Cpu className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{equipo.especificaciones?.cpu || 'N/A'}</span>
                </div>
                 <div className="flex items-center space-x-2 text-sm">
                    <MemoryStick className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{equipo.especificaciones?.ram || 'N/A'}</span>
                </div>
                 <div className="flex items-center space-x-2 text-sm">
                    <HardDrive className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{equipo.especificaciones?.disco || 'N/A'}</span>
                </div>
            </CardContent>
            <CardFooter className="p-2 border-t"> 
            </CardFooter>
        </Card>
    );
}
