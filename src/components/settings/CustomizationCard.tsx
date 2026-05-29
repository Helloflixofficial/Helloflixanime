import { useState, useRef } from "react";
import { ImagePlus, Palette, Trash2, Layout, PanelLeft, PanelRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  type IconPack,
  type CustomizationSettings,
  readImageAsDataUrl,
  ICON_PACK_OPTIONS,
  applyIconPack,
} from "@/services/customizationService";

interface Props {
  customization: CustomizationSettings;
  onChange: (updated: CustomizationSettings) => void;
}

function ImageUploadSlot({
  label,
  icon: Icon,
  imageUrl,
  onUpload,
  onClear,
}: {
  label: string;
  icon: React.ElementType;
  imageUrl: string | null;
  onUpload: (dataUrl: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageAsDataUrl(file, 3);
      onUpload(dataUrl);
      toast.success(`${label} updated!`);
    } catch (err: any) {
      toast.error(err.message);
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <label className="text-sm font-medium">{label}</label>
      </div>
      <div
        className="relative group rounded-xl overflow-hidden border border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
        style={{ height: 80 }}
        onClick={() => inputRef.current?.click()}
      >
        {imageUrl ? (
          <>
            <img 
              src={imageUrl} 
              alt={label} 
              className="w-full h-full object-cover" 
              loading="lazy"
              width={150}
              height={80}
            />
            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <span className="text-xs font-medium">Change</span>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-muted/30 flex items-center justify-center gap-2 text-muted-foreground">
            <ImagePlus className="h-5 w-5" />
            <span className="text-xs">Upload Image</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {imageUrl && (
        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onClear(); }}>
          <Trash2 className="h-3 w-3 mr-1" /> Remove
        </Button>
      )}
    </div>
  );
}

export function CustomizationCard({ customization, onChange }: Props) {
  const update = (partial: Partial<CustomizationSettings>) => {
    onChange({ ...customization, ...partial });
  };

  return (
    <Card className="anime-card lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Palette className="h-5 w-5 mr-2 text-primary" />
          Customization
        </CardTitle>
        <CardDescription>
          Custom backgrounds, icon styles — synced with your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Icon Pack */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Icon Pack</label>
            <p className="text-sm text-muted-foreground">Choose your icon style across the app</p>
          </div>
          <Select
            value={customization.icon_pack}
            onValueChange={(v) => {
              update({ icon_pack: v as IconPack });
              applyIconPack(v as IconPack);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ICON_PACK_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center">
                    <Layout className="h-4 w-4 mr-2 text-primary" />
                    <span>{opt.label}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground">({opt.desc})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </CardContent>
    </Card>
  );
}
