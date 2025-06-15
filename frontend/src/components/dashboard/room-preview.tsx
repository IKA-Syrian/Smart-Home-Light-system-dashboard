import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface RoomPreviewProps {
  room: {
    room_id: number;
    name: string;
    icon?: string;
    image?: string;
  };
  className?: string;
}

const defaultImages: Record<string, string> = {
  'Living Room': 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?auto=format&fit=crop&w=600&q=80',
  'Bedroom': 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=600&q=80',
  'Kitchen': 'https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?auto=format&fit=crop&w=600&q=80',
  'Bathroom': 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=600&q=80',
};

export function RoomPreview({ room, className }: RoomPreviewProps) {
  const navigate = useNavigate();
  const imageUrl = room.image || defaultImages[room.name] || 'https://images.unsplash.com/photo-1600566753104-685f4f24cb4d?auto=format&fit=crop&w=600&q=80';
  
  const handleClick = () => {
    navigate(`/rooms/${room.room_id}`);
  };
  
  return (
    <Card 
      className={cn(
        "overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300", 
        className
      )}
      onClick={handleClick}
    >
      <div className="relative h-40 w-full">
        <img 
          src={imageUrl} 
          alt={room.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 text-white font-medium text-lg">
          {room.name}
        </div>
      </div>
      <CardContent className="p-3">
        <p className="text-sm text-muted-foreground">
          Tap to view and control devices
        </p>
      </CardContent>
    </Card>
  );
}
