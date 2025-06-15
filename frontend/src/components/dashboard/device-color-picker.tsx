
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Circle, CircleArrowDown } from "lucide-react";

interface DeviceColorPickerProps {
  color: string | undefined;
  isEnabled: boolean;
  onColorChange: (color: string) => void;
}

const PRESET_COLORS = [
  { name: "Warm White", value: "#FFF4E0" },
  { name: "Cool White", value: "#F1F6FF" },
  { name: "Red", value: "#FF5B5B" },
  { name: "Green", value: "#4CAF50" },
  { name: "Blue", value: "#2196F3" },
  { name: "Purple", value: "#9C27B0" },
  { name: "Orange", value: "#FF9800" },
  { name: "Pink", value: "#E91E63" },
];

export function DeviceColorPicker({ color, isEnabled, onColorChange }: DeviceColorPickerProps) {
  return (
    <div className="pt-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Color</div>
        {isEnabled && (
          <DropdownMenu>
            <DropdownMenuTrigger 
              disabled={!isEnabled}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Circle className="h-3 w-3" style={{ fill: color || "#ffffff" }} stroke="none" />
              <CircleArrowDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="p-2">
              <div className="grid grid-cols-4 gap-1 mb-2">
                {PRESET_COLORS.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    onClick={() => onColorChange(colorOption.value)}
                    className="w-6 h-6 rounded-full border border-input hover:scale-110 transition-transform"
                    style={{ backgroundColor: colorOption.value }}
                    title={colorOption.name}
                  />
                ))}
              </div>
              <input 
                type="color" 
                value={color || "#ffffff"}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-full h-8 cursor-pointer" 
              />
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {color && isEnabled && (
        <div 
          className="h-2 mt-1 rounded-full animate-pulse" 
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
}
