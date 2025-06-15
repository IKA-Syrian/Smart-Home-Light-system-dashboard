import { useWebSocket } from "@/contexts/WebSocketContext";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Wifi, WifiOff } from "lucide-react";

export function WebSocketStatus() {
  const { isConnected, connectionAttempts } = useWebSocket();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-2">
            <Badge variant={isConnected ? "default" : "outline"} className="h-7 px-2 text-xs">
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" /> 
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" /> 
                  <span>
                    {connectionAttempts > 0 
                      ? `Reconnecting (${connectionAttempts})` 
                      : 'Disconnected'}
                  </span>
                </>
              )}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>
            {isConnected 
              ? 'WebSocket connection active: real-time control available'
              : 'WebSocket disconnected: using fallback HTTP API'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 