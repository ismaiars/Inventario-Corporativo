'use client';
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
interface WarrantyBadgeProps {
    tieneGarantia: boolean; 
    fechaLimiteGarantia?: Date | string | null;
}
export function WarrantyBadge({ tieneGarantia, fechaLimiteGarantia }: WarrantyBadgeProps) {
    if (!tieneGarantia) {
        return <Badge variant="secondary" className="cursor-default">Sin Garantía</Badge>;
    }
    const expiryDate = fechaLimiteGarantia ? new Date(fechaLimiteGarantia) : null;
    const isValidDate = expiryDate && !isNaN(expiryDate.getTime());
    if (!isValidDate) {
         return (
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Badge variant="destructive" className="cursor-default">Garantía (Fecha Inv.)</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>La fecha de garantía proporcionada no es válida.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
         );
    }
    const now = new Date();
    const daysUntilExpiry = differenceInDays(expiryDate, now);
    const isExpired = daysUntilExpiry < 0;
    const isExpiringSoon = !isExpired && daysUntilExpiry <= 30;
    let badgeVariant: "default" | "destructive" | "secondary" | "outline" = "default"; 
    let badgeText = "Con Garantía";
    let tooltipText = `Garantía hasta ${format(expiryDate, 'PPP', { locale: es })}`; 
    if (isExpired) {
        badgeVariant = "destructive"; 
        badgeText = "Vencida";
        tooltipText = `Garantía Vencida (${format(expiryDate, 'PPP', { locale: es })})`;
    } else if (isExpiringSoon) {
        badgeVariant = "secondary"; 
        badgeText = "Expira Pronto";
        tooltipText = `⚠️ Garantía vence en ${daysUntilExpiry + 1} día(s) (${format(expiryDate, 'PPP', { locale: es })})`; // Añade +1 porque differenceInDays cuenta días completos.
    }
    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                {}
                <TooltipTrigger asChild>
                    {}
                    <Badge variant={badgeVariant} className="cursor-default">
                        {badgeText}
                    </Badge>
                </TooltipTrigger>
                {}
                <TooltipContent>
                    <p>{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
