'use client';
import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label"; 
import { X, UploadCloud } from 'lucide-react';
interface ImageUploadProps {
    onFileChange: (file: File | null) => void;
    initialImageUrl?: string | null;
    label?: string;
}
export function ImageUpload({ onFileChange, initialImageUrl, label = "Foto del Equipo" }: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(initialImageUrl || null);
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        setPreview(initialImageUrl || null);
        if (!initialImageUrl) {
            setCurrentFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [initialImageUrl]);
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setCurrentFile(file);
            onFileChange(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
             if (!initialImageUrl) {
                setPreview(null);
                setCurrentFile(null);
                onFileChange(null);
            }
        }
    };
    const handleRemoveImage = () => {
        setPreview(null);
        setCurrentFile(null);
        onFileChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    const triggerFileInput = (e?: React.MouseEvent<HTMLDivElement>) => {
        e?.preventDefault();
        fileInputRef.current?.click();
    };
    const errorPlaceholder = 'https://placehold.co/200x150/f87171/ffffff?text=Error';
    return (
        <div className="space-y-2">
             <Label htmlFor="file-upload" className="text-sm font-medium">{label}</Label>
             <div
                className="w-full aspect-video border-2 border-dashed rounded-md flex items-center justify-center relative group bg-muted/30 hover:border-primary/50 transition-colors">
                {preview ? (
                    <>
                        {}
                        <Image
                            src={preview}
                            alt="Vista previa del equipo"
                            fill
                            style={{ objectFit: 'contain' }}
                            className="rounded-md"
                            onError={() => setPreview(errorPlaceholder)}
                        />
                        {}
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 h-7 w-7"
                            onClick={(e) => {
                                e.stopPropagation(); 
                                handleRemoveImage();
                            }}
                            type="button"
                            aria-label="Quitar imagen"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <div
                        className="text-center text-muted-foreground p-4 cursor-pointer w-full h-full flex flex-col items-center justify-center"
                        onClick={triggerFileInput} 
                        role="button" 
                        tabIndex={0} 
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileInput() }} 
                    >
                        <UploadCloud className="mx-auto h-10 w-10 mb-2" />
                        <p className="text-sm">Arrastra o haz clic para seleccionar una imagen</p>
                        <p className="text-xs">(JPG, PNG, WEBP)</p>
                    </div>
                )}
                 <Input
                    ref={fileInputRef}
                    id="file-upload" 
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0 pointer-events-none"
                    aria-hidden="true"
                />
            </div>
        </div>
    );
}
