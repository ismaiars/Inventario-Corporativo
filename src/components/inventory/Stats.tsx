// src/components/inventory/Stats.tsx
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Equipo, EstadoEquipo, Departamentos, Ubicaciones, TiposDispositivo, Usuario } from '@/types';
// Dynamically import jsPDF when needed to reduce bundle size
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileDown, TrendingUp, PieChart as PieChartIcon, CheckCircle, AlertCircle, Building, MapPin, Laptop, Tag } from 'lucide-react';
interface StatsProps {
    inventory: Equipo[];
    users: Usuario[];
}
interface PieChartData { name: string; value: number; fill: string; }
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}
/**
 * 
 * @param estado 
 * @returns 
 */
const getStatusText = (estado: EstadoEquipo | undefined | null): string => {
    if (!estado) return "Desconocido";
    switch (estado) {
        case EstadoEquipo.EnUso: return "En Uso";
        case EstadoEquipo.Mantenimiento: return "Mantenimiento";
        case EstadoEquipo.Obsoleta: return "Obsoleta";
        default: return "Desconocido";
    }
};

/**
 * 
 * @param items 
 * @param key 
 * @param possibleValues 
 * @param defaultName 
 * @returns 
 */
function countOccurrences<T extends keyof Equipo>(
    items: Equipo[],
    key: T,
    possibleValues: readonly string[],
    defaultName: string = "No asignado"
): { name: string; value: number }[] {
    if (!Array.isArray(items)) return [];
    const counts: Record<string, number> = {};
    possibleValues.forEach(val => { counts[val] = 0; });
    counts[defaultName] = 0;
    items.forEach(item => {
        const value = item?.[key] as string | undefined | null;
        if (value && possibleValues.includes(value)) {
            counts[value]++;
        } else {
            counts[defaultName]++;
        }
    });
    return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .filter(item => item.value > 0);
}

/**
 * 
 * @param items 
 * @returns 
 */
function countTipoDispositivo(items: Equipo[]): { name: string; value: number }[] {
    if (!Array.isArray(items)) return [];
    const counts: Record<string, number> = {};
    const defaultName = "No especificado";
    TiposDispositivo.forEach(val => { counts[val] = 0; });
    counts[defaultName] = 0;
    items.forEach(item => {
        const tipo = item?.detalles?.tipoDispositivo;
        if (tipo && TiposDispositivo.includes(tipo)) {
            counts[tipo]++;
        } else {
            counts[defaultName]++;
        }
    });
    return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .filter(item => item.value > 0);
}

/**
 * 
 * @param items 
 * @param users 
 * @param possibleDepartamentos 
 * @param defaultName 
 * @returns 
 */
function countDepartamentoUsuario(
    items: Equipo[],
    users: Usuario[],
    possibleDepartamentos: readonly string[],
    defaultName: string = "Sin asignar/Depto."
): { name: string; value: number }[] {
    if (!Array.isArray(items) || !Array.isArray(users)) return [];
    const counts: Record<string, number> = {};
    const userMap = new Map(
        users.map(user => user && user.id ? [user.id, user] : null).filter(Boolean) as [string, Usuario][]
    );
    possibleDepartamentos.forEach(val => { counts[val] = 0; });
    counts[defaultName] = 0;
    items.forEach(item => {
        if (item?.usuarioId) {
            const user = userMap.get(item.usuarioId);
            if (user?.departamento && possibleDepartamentos.includes(user.departamento)) {
                counts[user.departamento]++;
            } else {
                counts[defaultName]++;
            }
        } else {
            counts[defaultName]++;
        }
    });
    return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .filter(item => item.value > 0);
}
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = (params: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = params;
    const numCx = Number(cx) || 0;
    const numCy = Number(cy) || 0;
    const numInnerRadius = Number(innerRadius) || 0;
    const numOuterRadius = Number(outerRadius) || 0;
    const numPercent = Number(percent) || 0;
    if (numPercent < 0.03) { 
        return null;
    }
    const radius = numOuterRadius + 18; 
    const x = numCx + radius * Math.cos(-midAngle * RADIAN);
    const y = numCy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text
            x={x}
            y={y}
            fill="currentColor" 
            className="text-[10px] fill-muted-foreground" 
            textAnchor={x > numCx ? 'start' : 'end'} 
            dominantBaseline="central"
        >
            {`${(numPercent * 100).toFixed(0)}%`}
        </text>
    );
};
export function Stats({ inventory, users }: StatsProps) {
    const total = inventory?.length || 0;
    const enUso = inventory?.filter(e => e?.estado === EstadoEquipo.EnUso).length || 0;
    const mantenimiento = inventory?.filter(e => e?.estado === EstadoEquipo.Mantenimiento).length || 0;
    const obsoleta = inventory?.filter(e => e?.estado === EstadoEquipo.Obsoleta).length || 0;
    const conGarantia = inventory?.filter(e => e?.tieneGarantia).length || 0;
    const sinGarantia = total - conGarantia;
    const chartColors = [
        'hsl(var(--chart-1))',
        'hsl(var(--chart-2))',
        'hsl(var(--chart-3))',
        'hsl(var(--chart-4))',
        'hsl(var(--chart-5))',
        'hsl(var(--chart-1) / 0.7)', 
        'hsl(var(--chart-2) / 0.7)',
        'hsl(var(--chart-3) / 0.7)',
    ];
    const assignColors = (data: { name: string; value: number }[] | undefined): PieChartData[] => {
        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }
        return data.map((item, index) => ({
            ...item,
            fill: chartColors[index % chartColors.length]
        }));
    };
    const estadoData = assignColors(countOccurrences(inventory || [], 'estado', Object.values(EstadoEquipo), "Desconocido"));
    const garantiaData = assignColors(
        [
            { name: 'Con Garantía', value: conGarantia },
            { name: 'Sin Garantía', value: sinGarantia },
        ].filter(item => item.value > 0) 
    );
    const departamentoData = assignColors(countDepartamentoUsuario(inventory || [], users || [], Departamentos, "Sin asignar/Depto."));
    const ubicacionData = assignColors(countOccurrences(inventory || [], 'ubicacion', Ubicaciones, "Sin Ubic."));
    const tipoDispositivoData = assignColors(countTipoDispositivo(inventory || []));
    const chartConfig = {
        value: { label: 'Equipos' }, 
        [EstadoEquipo.EnUso]: { label: getStatusText(EstadoEquipo.EnUso), color: 'hsl(var(--chart-1))' },
        [EstadoEquipo.Mantenimiento]: { label: getStatusText(EstadoEquipo.Mantenimiento), color: 'hsl(var(--chart-2))' },
        [EstadoEquipo.Obsoleta]: { label: getStatusText(EstadoEquipo.Obsoleta), color: 'hsl(var(--chart-3))' },
        'Desconocido': { label: 'Desconocido', color: 'hsl(var(--chart-5))' }, 
        'Con Garantía': { label: 'Con Garantía', color: 'hsl(var(--chart-1))' },
        'Sin Garantía': { label: 'Sin Garantía', color: 'hsl(var(--chart-4))' },
        ...Object.fromEntries(
            Departamentos.map((dep, i) => [dep, { label: dep, color: chartColors[i % chartColors.length] }])
        ),
         "Sin asignar/Depto.": { label: 'Sin asignar/Depto.', color: chartColors[Departamentos.length % chartColors.length] }, 
        ...Object.fromEntries(
            Ubicaciones.map((ubi, i) => [ubi, { label: ubi, color: chartColors[i % chartColors.length] }])
        ),
         "Sin Ubic.": { label: 'Sin Ubic.', color: chartColors[Ubicaciones.length % chartColors.length] }, 
        ...Object.fromEntries(
            TiposDispositivo.map((tipo, i) => [tipo, { label: tipo, color: chartColors[i % chartColors.length] }])
        ),
        "No especificado": { label: 'No especificado', color: chartColors[TiposDispositivo.length % chartColors.length] }, 
    };
    const exportPDF = async () => {
        // Usamos orientación horizontal para acomodar más columnas
        const jsPDFModule = await import('jspdf');
        const autoTable = await import('jspdf-autotable');
        const doc = new jsPDFModule.jsPDF('l', 'mm', 'a4');

        // --- Tabla 1: Información general del equipo y usuario ---
        const tableColumnGeneral = [
            "Serial",
            "Nombre",
            "Marca",
            "Modelo",
            "Tipo Disp.",
            "Estado",
            "Usuario",
            "Departamento",
            "Ubicación",
            "Garantía"
        ];
        const tableRowsGeneral: (string | null)[][] = [];

        // --- Tabla 2: Detalles técnicos y accesorios ---
        const tableColumnDetalles = [
            "Serial",
            "CPU",
            "RAM",
            "Disco",
            "SO",
            "Mouse",
            "Cargador",
            "Notas",
            "Det. Garantía"
        ];
        const tableRowsDetalles: (string | null)[][] = [];

        // Conjunto para almacenar los nombres de usuarios con equipo asignado y luego generar líneas de firma
        const uniqueUsers = new Set<string>();
        const userMap = new Map(
            users.map(u => u && u.id ? [u.id, u] : null).filter(Boolean) as [string, Usuario][]
        );
        inventory.forEach(item => {
             if (!item) return; 
             const assignedUser = item.usuarioId ? userMap.get(item.usuarioId) : null;
             const itemData = [
                 item.serial || 'N/A',
                 item.nombre || 'N/A',
                 item.marca || 'N/A',
                 item.modelo || 'N/A',
                 item.detalles?.tipoDispositivo || 'N/A',
                 getStatusText(item.estado),
                 assignedUser?.nombreCompleto || 'N/A',
                 assignedUser?.departamento || 'N/A',
                 item.ubicacion || 'N/A',
                 item.tieneGarantia ? 'Sí' : 'No'
             ];

             // Registrar usuario con equipo asignado para firmas
             if (assignedUser?.nombreCompleto) {
                 uniqueUsers.add(assignedUser.nombreCompleto);
             }

             const detalleData = [
                 item.serial || 'N/A',
                 item.especificaciones?.cpu || 'N/A',
                 item.especificaciones?.ram || 'N/A',
                 item.especificaciones?.disco || 'N/A',
                 item.especificaciones?.so || 'N/A',
                 item.detalles?.mouse || 'N/A',
                 item.detalles?.cargador || 'N/A',
                 item.detalles?.notas || 'N/A',
                 item.detallesGarantia || 'N/A'
             ];

             tableRowsGeneral.push(itemData);
             tableRowsDetalles.push(detalleData);
        });
        const now = new Date();
        const fechaHoraFormateada = format(now, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
        doc.setFontSize(18);
        doc.text("Reporte de Inventario Corporativo", 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generado el: ${fechaHoraFormateada}`, 14, 30);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Total Equipos: ${total} | En Uso: ${enUso} | Mantenimiento: ${mantenimiento} | Obsoletos: ${obsoleta}`, 14, 38);
        doc.text(`Con Garantía: ${conGarantia} | Sin Garantía: ${sinGarantia}`, 14, 44);
        const tableYStart = 70; // más espacio después de la línea de garantía

        // ---- Sección: Información General ----
        doc.setFontSize(16);
        doc.text('INFORMACIÓN GENERAL', 14, tableYStart - 10);
        doc.setFontSize(12);
        doc.autoTable({
            head: [tableColumnGeneral],
            body: tableRowsGeneral,
            startY: tableYStart,
            headStyles: { fillColor: [22, 160, 133] },
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            didDrawPage: function (data: any) {
                doc.setFontSize(10);
                doc.setTextColor(150);
                const pageStr = 'Página ' + (doc as any).internal.getNumberOfPages();
                doc.text(pageStr, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        // ---- Página nueva para Informes Técnicos ----
        doc.addPage();
        const techStartY = 30;
        doc.setFontSize(16);
        doc.text('INFORMES TÉCNICOS', 14, techStartY - 10);
        doc.setFontSize(12);
        doc.autoTable({
            head: [tableColumnDetalles],
            body: tableRowsDetalles,
            startY: techStartY,
            headStyles: { fillColor: [22, 160, 133] },
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            didDrawPage: function (data: any) {
                doc.setFontSize(10);
                doc.setTextColor(150);
                const pageStr = 'Página ' + (doc as any).internal.getNumberOfPages();
                doc.text(pageStr, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        // ---- Página nueva para Firmas Responsables ----
        doc.addPage();
        let firmaY = 30;
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(16);
        doc.text('FIRMAS RESPONSABLES', 14, firmaY - 10);
        doc.setFontSize(12);

        uniqueUsers.forEach(nombre => {
            if (firmaY > pageHeight - 20) {
                doc.addPage();
                firmaY = 30;
                doc.setFontSize(12);
            }
            doc.text(`${nombre}: ________________________________`, 14, firmaY);
            firmaY += 10;
        });
        const nombreArchivo = `reporte_inventario_${format(now, 'yyyyMMdd_HHmm')}.pdf`;
        doc.save(nombreArchivo);
    };

    // Genera un PDF con etiquetas de Equipo y Cargador para cada item del inventario
    const exportLabelsPDF = async () => {
        const jsPDFModule = await import('jspdf');
        await import('jspdf-autotable');
        const doc = new jsPDFModule.jsPDF('p', 'mm', 'a4');
        const labelWidth = 90;   // dos etiquetas por fila
        const labelHeight = 25; // alto de cada etiqueta
        const spaceX = 5;
        const spaceY = 5;
        const marginX = 10;
        const marginY = 10;
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        let x = marginX;
        let y = marginY;

        inventory.forEach(item => {
            const serial = item?.serial || 'N/A';
            ['Equipo', 'Cargador'].forEach(type => {
                // Colores corporativos azul
                const borderColor = [37, 99, 235] as const;       // Azul medio
                const fillColor = [219, 234, 254] as const;        // Azul claro para fondo
                const textColorHeader = [30, 64, 175] as const;    // Azul oscuro para encabezado

                // Dibuja un rectángulo con relleno
                doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
                doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
                doc.setLineWidth(0.5);
                doc.rect(x, y, labelWidth, labelHeight, 'FD'); // F = fill, D = stroke

                // Encabezado (tipo)
                doc.setFontSize(9);
                doc.setTextColor(textColorHeader[0], textColorHeader[1], textColorHeader[2]);
                doc.setFont('helvetica', 'bold');
                doc.text(type, x + 4, y + 8);

                // Número de serie centrado verticalmente
                doc.setFontSize(13);
                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'normal');
                const serialY = y + labelHeight / 2 + 4; // ligeramente más abajo del centro
                doc.text(serial, x + 4, serialY);
                 
                // Calcular siguiente posición
                x += labelWidth + spaceX;
                if (x + labelWidth > pageWidth - marginX) {
                    x = marginX;
                    y += labelHeight + spaceY;
                    if (y + labelHeight > pageHeight - marginY) {
                        doc.addPage();
                        x = marginX;
                        y = marginY;
                    }
                }
            });
        });

        const now = new Date();
        const nombreArchivo = `etiquetas_${format(now, 'yyyyMMdd_HHmm')}.pdf`;
        doc.save(nombreArchivo);
    };
    return (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-1">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center">
                        <TrendingUp className="mr-2 h-5 w-5 text-primary" /> Resumen Rápido
                    </CardTitle>
                    <CardDescription>Contadores totales del inventario.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between items-center font-medium">
                        <span>Total Equipos:</span> <span className="text-lg">{total}</span>
                    </div>
                    <hr/>
                    <CountItem label="En Uso" value={enUso} color="text-green-600" />
                    <CountItem label="Mantenimiento" value={mantenimiento} color="text-yellow-600" />
                    <CountItem label="Obsoletos" value={obsoleta} color="text-red-600" />
                    <hr/>
                    <CountItem label="Con Garantía" value={conGarantia} color="text-blue-600" icon={<CheckCircle className="h-4 w-4 mr-1.5"/>} />
                    <CountItem label="Sin Garantía" value={sinGarantia} color="text-gray-500" icon={<AlertCircle className="h-4 w-4 mr-1.5"/>} />
                    <Button
                        onClick={exportPDF}
                        className="w-full mt-5"
                        disabled={!inventory || inventory.length === 0} 
                    >
                        <FileDown className="mr-2 h-4 w-4" /> Exportar Informe PDF
                    </Button>
                    <Button
                        onClick={exportLabelsPDF}
                        className="w-full mt-2"
                        disabled={!inventory || inventory.length === 0}
                    >
                        <Tag className="mr-2 h-4 w-4" /> Generar Etiquetas
                    </Button>
                </CardContent>
            </Card>
            <PieChartCard
                title="Distribución por Estado"
                description="Equipos en cada estado."
                data={estadoData}
                config={chartConfig}
                icon={<PieChartIcon className="mr-2 h-5 w-5 text-primary"/>} 
            />
            <PieChartCard
                title="Distribución por Garantía"
                description="Equipos con y sin garantía."
                data={garantiaData}
                config={chartConfig}
            />
            <PieChartCard
                title="Distribución por Departamento"
                description="Depto. del usuario asignado."
                data={departamentoData}
                config={chartConfig}
                icon={<Building className="mr-2 h-5 w-5 text-primary"/>}
            />
            <PieChartCard
                title="Distribución por Ubicación"
                description="Equipos en cada ubicación física."
                data={ubicacionData}
                config={chartConfig}
                icon={<MapPin className="mr-2 h-5 w-5 text-primary"/>}
            />
            <PieChartCard
                title="Distribución por Tipo"
                description="Cantidad de cada tipo de dispositivo."
                data={tipoDispositivoData}
                config={chartConfig}
                icon={<Laptop className="mr-2 h-5 w-5 text-primary"/>}
            />
        </div>
    );
}
function CountItem({ label, value, color, icon }: { label: string, value: number, color?: string, icon?: React.ReactNode }) {
    return (
        <div className={`flex justify-between items-center ${color || 'text-foreground'}`}>
            <span className="flex items-center">{icon}{label}:</span>
            <span className="font-semibold">{value}</span>
        </div>
    );
}
interface PieChartCardProps {
    title: string;
    description: string;
    data: PieChartData[];
    config: any; 
    icon?: React.ReactNode;
}

function PieChartCard({ title, description, data, config, icon }: PieChartCardProps) {
    const chartHeightClass = "max-h-[230px]";
    const legendMarginClass = "-mt-4"; 
    if (!Array.isArray(data) || data.length === 0) {
        return (
            <Card className="flex flex-col min-h-[300px]"> {}
                <CardHeader className="items-center pb-2">
                    <CardTitle className="text-base flex items-center">{icon}{title}</CardTitle>
                    <CardDescription className="text-xs">{description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-4 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No hay datos.</p>
                </CardContent>
            </Card>
        );
    }
    return (
        <Card className="flex flex-col min-h-[300px]"> {}
             <CardHeader className="items-center pb-2">
                 <CardTitle className="text-base flex items-center">{icon}{title}</CardTitle>
                 <CardDescription className="text-xs">{description}</CardDescription>
             </CardHeader>
             <CardContent className="flex-1 pb-4 flex flex-col items-center justify-center">
                 <ChartContainer config={config} className={`mx-auto aspect-square w-full ${chartHeightClass}`}>
                    <RechartsPieChart>
                         <ChartTooltip
                            cursor={false} 
                            content={<ChartTooltipContent indicator="dot" hideLabel />} 
                         />
                         <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"  
                            innerRadius={50} 
                            outerRadius={80} 
                            strokeWidth={2}  
                            labelLine={false} 
                            label={renderCustomizedLabel} 
                         >
                            {data.map((entry) => (
                                <Cell
                                    key={`cell-${entry.name}`}
                                    fill={entry.fill} 
                                    className="focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            ))}
                        </Pie>
                         <ChartLegend
                            content={<ChartLegendContent nameKey="name" />} 
                            className={`flex-wrap gap-x-2 gap-y-0 text-xs ${legendMarginClass}`} 
                         />
                    </RechartsPieChart>
                </ChartContainer>
             </CardContent>
        </Card>
    );
}
