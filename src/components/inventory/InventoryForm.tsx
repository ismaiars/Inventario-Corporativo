'use client';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Equipo, EstadoEquipo, Ubicaciones, TiposDispositivo, Usuario } from '@/types';
import { InventoryFormSchema } from '@/lib/schema';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { ImageUpload } from './ImageUpload';
import { cn } from "@/lib/utils";
import { AlertCircle, Loader2 } from "lucide-react";
import { useUsers } from '@/hooks/useUsers';
import { z } from 'zod';

type InventoryFormData = z.infer<typeof InventoryFormSchema>;

interface InventoryFormProps {
    initialData?: Equipo | null;
    onSubmit: (data: FormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

function getStatusText(estado: EstadoEquipo): string {
     switch (estado) {
        case EstadoEquipo.EnUso: return "En Uso";
        case EstadoEquipo.Mantenimiento: return "Mantenimiento";
        case EstadoEquipo.Obsoleta: return "Obsoleta";
        default: return "Desconocido";
    }
}

export function InventoryForm({ initialData, onSubmit, onCancel, isLoading = false }: InventoryFormProps) {
    const { toast } = useToast();
    const { users, isLoadingUsers } = useUsers();
    const form = useForm<InventoryFormData>({
        resolver: zodResolver(InventoryFormSchema),
        defaultValues: {
            nombre: initialData?.nombre || '',
            serial: initialData?.serial || '',
            modelo: initialData?.modelo || '',
            marca: initialData?.marca || '',
            tipo: initialData?.tipo || '',
            estado: initialData?.estado || EstadoEquipo.EnUso,
            ubicacion: initialData?.ubicacion || Ubicaciones[0],
            usuarioId: initialData?.usuarioId || undefined,
            tieneGarantia: initialData?.tieneGarantia || false,
            detallesGarantia: initialData?.detallesGarantia || '',
            // Especificaciones
            cpu: initialData?.especificaciones?.cpu || '',
            ram: initialData?.especificaciones?.ram || '',
            disco: initialData?.especificaciones?.disco || '',
            so: initialData?.especificaciones?.so || '',
            // Detalles adicionales
            tipoDispositivo: initialData?.detalles?.tipoDispositivo || undefined,
            mouse: initialData?.detalles?.mouse || '',
            cargador: initialData?.detalles?.cargador || '',
            notas: initialData?.detalles?.notas || '',
            foto: initialData?.fotoUrl || null,
        },
    });

    const watchTieneGarantia = form.watch('tieneGarantia');

    useEffect(() => {
        if (initialData) {
            form.reset({
                nombre: initialData.nombre || '',
                serial: initialData.serial || '',
                modelo: initialData.modelo || '',
                marca: initialData.marca || '',
                tipo: initialData.tipo || '',
                estado: initialData.estado || EstadoEquipo.EnUso,
                ubicacion: initialData.ubicacion || Ubicaciones[0],
                usuarioId: initialData.usuarioId || undefined,
                tieneGarantia: initialData.tieneGarantia || false,
                detallesGarantia: initialData.detallesGarantia || '',
                cpu: initialData.especificaciones?.cpu || '',
                ram: initialData.especificaciones?.ram || '',
                disco: initialData.especificaciones?.disco || '',
                so: initialData.especificaciones?.so || '',
                tipoDispositivo: initialData.detalles?.tipoDispositivo || undefined,
                mouse: initialData.detalles?.mouse || '',
                cargador: initialData.detalles?.cargador || '',
                notas: initialData.detalles?.notas || '',
                foto: initialData.fotoUrl || null,
            });
        }
    }, [initialData, form]);

    const handleFormSubmit = async (data: InventoryFormData) => {
        const formData = new FormData();

        // Construir objetos anidados de especificaciones y detalles
        const {
            cpu, ram, disco, so,
            tipoDispositivo, mouse, cargador, notas,
            ...rest
        } = data;

        const especificacionesObj = { cpu, ram, disco, so };
        const detallesObj = { tipoDispositivo, mouse, cargador, notas };

        // Añadir el resto de campos simples
        Object.entries(rest).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                if (key === 'foto') {
                    if (value instanceof File) {
                        formData.append(key, value);
                    }
                } else {
                    formData.append(key, String(value));
                }
            }
        });

        // Añadir los objetos anidados como JSON
        formData.append('especificaciones', JSON.stringify(especificacionesObj));
        formData.append('detalles', JSON.stringify(detallesObj));

        try {
            await onSubmit(formData);
        } catch (error: any) {
             toast({ variant: "destructive", title: "Error al guardar", description: error?.message || "Error desconocido" });
        }
    };

    const UNASSIGNED_VALUE = "__NONE__";

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
                 {!form.formState.isValid && form.formState.isSubmitted && (
                    <div className="flex items-center gap-x-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                       <AlertCircle className="h-4 w-4" />
                       <p>Por favor, corrija los errores indicados en el formulario.</p>
                    </div>
                 )}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                     <div className="space-y-6">
                         <FormField control={form.control} name="nombre" render={({ field }) => ( <FormItem><FormLabel>Nombre del Equipo *</FormLabel><FormControl><Input placeholder="Ej: Laptop-Marketing-05" {...field} /></FormControl><FormMessage /></FormItem> )} />
                         <FormField control={form.control} name="serial" render={({ field }) => ( <FormItem><FormLabel>Número de Serie *</FormLabel><FormControl><Input placeholder="Ej: ABC123456" {...field} /></FormControl><FormMessage /></FormItem> )} />
                         <FormField control={form.control} name="modelo" render={({ field }) => ( <FormItem><FormLabel>Modelo *</FormLabel><FormControl><Input placeholder="Ej: Latitude 5420" {...field} /></FormControl><FormMessage /></FormItem> )} />
                         <FormField control={form.control} name="marca" render={({ field }) => ( <FormItem><FormLabel>Marca *</FormLabel><FormControl><Input placeholder="Ej: Dell" {...field} /></FormControl><FormMessage /></FormItem> )} />
                         <FormField control={form.control} name="tipo" render={({ field }) => ( <FormItem><FormLabel>Tipo *</FormLabel><FormControl><Input placeholder="Ej: Laptop" {...field} /></FormControl><FormMessage /></FormItem> )} />
                         <FormField control={form.control} name="estado" render={({ field }) => ( <FormItem><FormLabel>Estado *</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione estado..." /></SelectTrigger></FormControl><SelectContent>{Object.values(EstadoEquipo).map(estado => ( <SelectItem key={estado} value={estado}>{getStatusText(estado)}</SelectItem> ))}</SelectContent></Select><FormMessage /></FormItem> )} />
                         <FormField control={form.control} name="ubicacion" render={({ field }) => ( <FormItem><FormLabel>Ubicación *</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione ubicación..." /></SelectTrigger></FormControl><SelectContent>{Ubicaciones.map(ubi => ( <SelectItem key={ubi} value={ubi}>{ubi}</SelectItem> ))}</SelectContent></Select><FormMessage /></FormItem> )} />
                        {/* Especificaciones Técnicas */}
                        <FormField control={form.control} name="cpu" render={({ field }) => ( <FormItem><FormLabel>CPU</FormLabel><FormControl><Input placeholder="Ej: Intel i5-1135G7" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="ram" render={({ field }) => ( <FormItem><FormLabel>RAM</FormLabel><FormControl><Input placeholder="Ej: 16GB" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="disco" render={({ field }) => ( <FormItem><FormLabel>Disco</FormLabel><FormControl><Input placeholder="Ej: 512GB SSD" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="so" render={({ field }) => ( <FormItem><FormLabel>Sistema Operativo</FormLabel><FormControl><Input placeholder="Ej: Windows 11" {...field} /></FormControl><FormMessage /></FormItem> )} />
                     </div>
                     <div className="space-y-6">
                         <FormField
                            control={form.control}
                            name="usuarioId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Usuario Asignado</FormLabel>
                                    <Select
                                        onValueChange={(value) => field.onChange(value === UNASSIGNED_VALUE ? null : value)}
                                        value={field.value ?? UNASSIGNED_VALUE}
                                        disabled={isLoadingUsers}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={isLoadingUsers ? "Cargando..." : "Seleccione..."} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={UNASSIGNED_VALUE}>-- Sin asignar --</SelectItem>
                                            {Array.isArray(users) && users.map((user: Usuario) => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {user.nombreCompleto} ({user.departamento})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>Asigne este equipo.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="foto"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Imagen</FormLabel>
                                    <FormControl>
                                        <ImageUpload
                                            onFileChange={(file) => field.onChange(file)}
                                            initialImageUrl={initialData?.fotoUrl}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="tieneGarantia"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>¿Tiene Garantía?</FormLabel>
                                        <FormDescription>Marque si el equipo cuenta con garantía.</FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                        {watchTieneGarantia && (
                             <FormField
                                control={form.control}
                                name="detallesGarantia"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Detalles de Garantía</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Fecha, proveedor, etc." className="min-h-[60px]" {...field} />
                                        </FormControl>
                                        <FormDescription>Info relevante.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        {/* Detalles Adicionales */}
                        <FormField control={form.control} name="tipoDispositivo" render={({ field }) => ( <FormItem><FormLabel>Tipo de Dispositivo</FormLabel><Select onValueChange={field.onChange} value={field.value ?? undefined}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione tipo..." /></SelectTrigger></FormControl><SelectContent>{TiposDispositivo.map(td => ( <SelectItem key={td} value={td}>{td}</SelectItem> ))}</SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="mouse" render={({ field }) => ( <FormItem><FormLabel>Mouse</FormLabel><FormControl><Input placeholder="Ej: Logitech M185" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="cargador" render={({ field }) => ( <FormItem><FormLabel>Cargador</FormLabel><FormControl><Input placeholder="Ej: 65W USB-C" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="notas" render={({ field }) => ( <FormItem><FormLabel>Notas</FormLabel><FormControl><Textarea placeholder="Información adicional" className="min-h-[60px]" {...field} /></FormControl><FormMessage /></FormItem> )} />
                     </div>
                </div>
                 <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}> Cancelar </Button>
                    <Button type="submit" disabled={isLoading || isLoadingUsers}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Guardando...' : (initialData ? 'Actualizar Equipo' : 'Agregar Equipo')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
