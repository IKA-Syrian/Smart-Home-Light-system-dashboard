import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

// Local interface definition to avoid circular dependencies
interface UsageData {
  date: string;
  value: number;
}

interface ElectricityUsage {
  deviceId: string | number;
  daily: UsageData[];
  weekly: UsageData[];
  monthly: UsageData[];
  totalKwh: number;
  costPerKwh: number;
}

interface EnergyUsageChartProps {
  usage: ElectricityUsage;
  title?: string;
}

export function EnergyUsageChart({ usage, title = "Energy Consumption" }: EnergyUsageChartProps) {
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("daily");
  
  const data = useMemo(() => {
    switch (view) {
      case "daily":
        return usage.daily;
      case "weekly":
        return usage.weekly;
      case "monthly":
        return usage.monthly;
      default:
        return usage.daily;
    }
  }, [usage, view]);
  
  const totalUsage = usage.totalKwh.toFixed(2);
  const costEstimate = (usage.totalKwh * usage.costPerKwh).toFixed(2);

  const config = {
    energy: {
      theme: {
        light: "#9b87f5",
        dark: "#7E69AB",
      },
      label: "Energy",
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Power consumption overview and history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Total Usage</div>
                <div className="text-2xl font-bold">{totalUsage} kWh</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Estimated Cost</div>
                <div className="text-2xl font-bold">${costEstimate}</div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs value={view} onValueChange={(v) => setView(v as "daily" | "weekly" | "monthly")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            <TabsContent value={view} className="h-[300px] mt-2">
              <ChartContainer config={config}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis 
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${value} kWh`}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} kWh`, "Energy"]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Bar 
                      dataKey="value" 
                      name="energy" 
                      fill="var(--color-energy)" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
