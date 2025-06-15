
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, PlusCircle, Calendar, Clock, Loader2 } from "lucide-react";
import { useScenes, useActivateScene } from "@/hooks/useApi";
import { Scene } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export default function ScenesPage() {
  const { toast } = useToast();
  const { data: scenes = [], isLoading } = useScenes();
  const activateSceneMutation = useActivateScene();

  const handleActivateScene = async (sceneId: number) => {
    try {
      await activateSceneMutation.mutateAsync(sceneId);
      toast({
        title: "Scene Activated",
        description: "Your scene has been applied successfully",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Activate Scene",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading scenes...</span>
      </div>
    );
  }
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Scenes</h2>
          <p className="text-muted-foreground">
            Create and manage your lighting scenes
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Scene
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scenes.map(scene => (
          <Card key={scene.id} className="overflow-hidden">
            <CardHeader>
              <CardTitle>{scene.name}</CardTitle>
              <CardDescription>{scene.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {scene.isActive && (
                <div className="flex items-center text-sm gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Active Scene</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-secondary/50 p-3">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Ready to activate</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleActivateScene(scene.id)}
                disabled={activateSceneMutation.isPending}
              >
                <PlayCircle className="h-4 w-4 mr-1" />
                {activateSceneMutation.isPending ? "Running..." : "Run"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
