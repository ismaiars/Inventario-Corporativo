'use client';
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Departamentos, Ubicaciones, EstadoEquipo } from '@/types';
import { Search, X, Filter as FilterIcon } from 'lucide-react';
interface FilterState {
    searchTerm: string;
    departamento: string;
    estado: string;
    ubicacion: string;
}

interface FiltersProps {
    onFilterChange: (filters: Omit<FilterState, 'garantia'>) => void; 
    initialFilters: FilterState;
}
const getStatusText = (estado: EstadoEquipo | 'all'): string => {
    if (estado === 'all') return "Todos los Estados";
    switch (estado) {
        case EstadoEquipo.EnUso: return "En Uso";
        case EstadoEquipo.Mantenimiento: return "Mantenimiento";
        case EstadoEquipo.Obsoleta: return "Obsoleta";
        default: return "Desconocido";
    }
}
export function Filters({ onFilterChange, initialFilters }: FiltersProps) {
    const [filters, setFilters] = useState<Omit<FilterState, 'garantia'>>({
        searchTerm: initialFilters.searchTerm,
        departamento: initialFilters.departamento,
        estado: initialFilters.estado,
        ubicacion: initialFilters.ubicacion,
    });
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        if (name === 'searchTerm') {
            onFilterChange(newFilters); // aplicar inmediatamente
        }
    };
     const handleSelectChange = (name: keyof Omit<FilterState, 'garantia'>) => (value: string) => {
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        onFilterChange(newFilters); 
    };
    const handleApplyFilters = () => {
        onFilterChange(filters);
    };
    const handleResetFilters = () => {
        const resetState: Omit<FilterState, 'garantia'> = { searchTerm: '', departamento: 'all', estado: 'all', ubicacion: 'all' };
        setFilters(resetState);
        onFilterChange(resetState);
    };
    const handleQuickFilterClick = (name: keyof Omit<FilterState, 'garantia'>, value: string) => {
        const newValue = filters[name] === value ? 'all' : value;
        const newFilters = { ...filters, [name]: newValue };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };
    return (
        <div className="p-4 border rounded-lg bg-card shadow-sm mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 items-end"> {/* Ajustado a 4 */}
                <div className="md:col-span-2">
                    <Label htmlFor="searchTerm" className="text-sm font-medium">Buscar (Nombre o Serial)</Label>
                    <div className="relative mt-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id="searchTerm" name="searchTerm" placeholder="Escriba para buscar..." value={filters.searchTerm} onChange={handleInputChange} className="pl-8" />
                        {filters.searchTerm && ( <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => handleInputChange({ target: { name: 'searchTerm', value: '' } } as any)} type="button"> <X className="h-4 w-4"/> </Button> )}
                    </div>
                </div>
                <div>
                     <Label htmlFor="estado" className="text-sm font-medium">Estado</Label>
                     <Select name="estado" value={filters.estado} onValueChange={handleSelectChange('estado')}>
                        <SelectTrigger id="estado" className="mt-1"><SelectValue placeholder="Filtrar por estado..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los Estados</SelectItem>
                            {Object.values(EstadoEquipo).map(estado => ( <SelectItem key={estado} value={estado}>{getStatusText(estado)}</SelectItem> ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                     <Label htmlFor="departamento" className="text-sm font-medium">Departamento</Label>
                     <Select name="departamento" value={filters.departamento} onValueChange={handleSelectChange('departamento')}>
                        <SelectTrigger id="departamento" className="mt-1"><SelectValue placeholder="Filtrar por depto..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los Deptos.</SelectItem>
                            {Departamentos.map(dep => ( <SelectItem key={dep} value={dep}>{dep}</SelectItem> ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex items-end justify-self-start md:justify-self-end mt-4 md:mt-0">
                    <Button variant="outline" onClick={handleResetFilters} title="Limpiar todos los filtros">
                        <X className="h-4 w-4 mr-1 sm:mr-0"/> <span className="hidden sm:inline ml-1">Limpiar</span> 
                    </Button>
                 </div>
            </div>
             <div className="mt-4 pt-4 border-t space-y-3">
                 <div className="flex flex-wrap items-center gap-2">
                     <span className="text-sm font-medium mr-2 text-muted-foreground self-center">Rápidos (Estado):</span>
                     <Button size="sm" variant={filters.estado === EstadoEquipo.EnUso ? "default" : "outline"} onClick={() => handleQuickFilterClick('estado', EstadoEquipo.EnUso)}>En Uso</Button>
                     <Button size="sm" variant={filters.estado === EstadoEquipo.Mantenimiento ? "secondary" : "outline"} onClick={() => handleQuickFilterClick('estado', EstadoEquipo.Mantenimiento)}>Mantenimiento</Button>
                     <Button size="sm" variant={filters.estado === EstadoEquipo.Obsoleta ? "destructive" : "outline"} onClick={() => handleQuickFilterClick('estado', EstadoEquipo.Obsoleta)}>Obsoletos</Button>
                 </div>
                 <div className="flex flex-wrap items-center gap-2">
                     <span className="text-sm font-medium mr-2 text-muted-foreground self-center">Rápidos (Departamento):</span>
                     {Departamentos.map(dep => ( <Button key={dep} size="sm" variant={filters.departamento === dep ? "default" : "outline"} onClick={() => handleQuickFilterClick('departamento', dep)}> {dep} </Button> ))}
                 </div>
                 <div className="flex flex-wrap items-center gap-2">
                     <span className="text-sm font-medium mr-2 text-muted-foreground self-center">Rápidos (Ubicación):</span>
                     {Ubicaciones.map(ubi => ( <Button key={ubi} size="sm" variant={filters.ubicacion === ubi ? "default" : "outline"} onClick={() => handleQuickFilterClick('ubicacion', ubi)}> {ubi} </Button> ))}
                 </div>
             </div>
        </div>
    );
}
