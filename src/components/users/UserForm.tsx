'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UsuarioFormData, UsuarioFormSchema } from '@/lib/schema';
import { Departamentos, TiposEmpleado, Usuario } from '@/types'; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { ImageUpload } from '@/components/inventory/ImageUpload';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
interface UserFormProps {
    onSubmit: (data: FormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    initialData?: UsuarioFormData | null; 
}
export function UserForm({ onSubmit, onCancel, isLoading = false, initialData }: UserFormProps) {
    const { toast } = useToast();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const form = useForm<UsuarioFormData>({
        resolver: zodResolver(UsuarioFormSchema),
        defaultValues: {
            nombreCompleto: initialData?.nombreCompleto || '',
            departamento: initialData?.departamento || Departamentos[0],
            tipoEmpleado: initialData?.tipoEmpleado || undefined, 
            fotoUrl: initialData?.fotoUrl || undefined,
        },
    });
    React.useEffect(() => {
        if (initialData) {
            form.reset({
                nombreCompleto: initialData.nombreCompleto,
                departamento: initialData.departamento,
                tipoEmpleado: initialData.tipoEmpleado, 
                fotoUrl: initialData.fotoUrl || undefined,
            });
            setSelectedFile(null);
        } else {
            form.reset({
                nombreCompleto: '',
                departamento: Departamentos[0],
                tipoEmpleado: undefined, 
                fotoUrl: undefined,
            });
             setSelectedFile(null);
        }
    }, [initialData, form.reset]);
    const handleFormSubmit = async (data: UsuarioFormData) => {
        const formData = new FormData();
        formData.append('nombreCompleto', data.nombreCompleto);
        formData.append('departamento', data.departamento);
        if (data.tipoEmpleado) {
            formData.append('tipoEmpleado', data.tipoEmpleado);
        }
        if (selectedFile) {
            formData.append('foto', selectedFile, selectedFile.name);
        } else if (initialData?.fotoUrl && data.fotoUrl) {
        }
        try {
            await onSubmit(formData);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error al guardar usuario",
                description: error?.message || "No se pudo guardar la información del usuario.",
            });
        }
    };
    const handleFileSelected = (file: File | null) => {
        setSelectedFile(file);
    }; 
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                {!form.formState.isValid && form.formState.isSubmitted && (
                    <div className="flex items-center gap-x-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                       <AlertCircle className="h-4 w-4" />
                       <p>Por favor, corrija los errores indicados.</p>
                    </div>
                 )}
                {}
                <FormField
                    control={form.control}
                    name="nombreCompleto"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre Completo *</FormLabel>
                            <FormControl>
                                <Input placeholder="Nombre y Apellido(s)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {}
                <FormField
                    control={form.control}
                    name="departamento"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Departamento *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione departamento..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Departamentos.map(dep => (
                                        <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {}
                <FormField
                    control={form.control}
                    name="tipoEmpleado"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Empleado *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione el tipo..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {TiposEmpleado.map(tipo => (
                                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {}
                <ImageUpload
                    label="Foto de Perfil (Opcional)"
                    onFileChange={handleFileSelected}
                    initialImageUrl={form.watch('fotoUrl')}
                />
                {}
                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading || (!initialData && !form.formState.isDirty)}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Guardando...' : (initialData ? 'Actualizar Usuario' : 'Agregar Usuario')}
                    </Button>
                </div>
            </form>
        </Form>
    );
} 