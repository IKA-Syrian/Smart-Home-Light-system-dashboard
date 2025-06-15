import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, DollarSign, Sparkles, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import energyLogService from "@/services/energyLogService";
import type { EnergyLogSummary, RecentEnergySummary } from "@/types/api";
import { apiClient } from "@/lib/api";

// Define interface for the API response format
interface EnergyApiMinuteItem {
  timestamp: string;
  energy_wh: number;
  power_w: number;
  device_count?: number;
  led_count?: number;
}

interface EnergyApiResponse {
  status: string;
  data: {
    minute_data: EnergyApiMinuteItem[];
    total_energy_wh: number;
    total_power_w: number;
    unique_devices: number;
    unique_leds: number;
    start_time: string;
    end_time: string;
  };
}

interface EnhancedEnergyChartProps {
  deviceId?: number;
  ledId?: number;
  title?: string;
}

interface HourlyDataItem {
  date: string;
  hour: number;
  energy: number;
  cost: number;
}

// Chart color theme
const chartColors = {
  energy: {
    stroke: "#3b82f6", // Blue
    fill: "rgba(59, 130, 246, 0.2)",
    strokeWidth: 2,
  },
  power: {
    stroke: "#eab308", // Yellow
    fill: "rgba(234, 179, 8, 0.2)",
    strokeWidth: 2,
  },
  cost: {
    stroke: "#10b981", // Green
    fill: "rgba(16, 185, 129, 0.2)",
    strokeWidth: 2,
  },
  axes: {
    stroke: "hsl(var(--muted-foreground))",
    tick: "hsl(var(--muted-foreground))",
    fontSize: 12,
  },
  grid: {
    stroke: "var(--border)",
  },
  tooltip: {
    background: "var(--background)",
    border: "var(--border)",
    textColor: "var(--foreground)",
  }
};

export function EnhancedEnergyChart({ 
  deviceId = 1, 
  ledId = 2,
  title = "Energy Consumption"
}: EnhancedEnergyChartProps) {
  const [activeTab, setActiveTab] = useState<string>("daily");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState<EnergyLogSummary | null>(null);
  const [recentData, setRecentData] = useState<RecentEnergySummary | null>(null);
  
  // Fetch energy data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.info('Fetching energy data...');
        
        // Try to get and log the API response manually first to see what we're dealing with
        let responseData;
        let apiError = null;
        
        try {
          // First try with direct fetch to see raw data
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
          const response = await fetch(`${baseUrl}/energy/recent`);
          if (response.ok) {
            const rawData = await response.json();
            console.info('Raw API response:', rawData);
            responseData = rawData;
          } else {
            throw new Error(`API error: ${response.status}`);
          }
        } catch (fetchError) {
          // Try the apiClient instead
          console.info('Direct fetch failed, trying apiClient...', fetchError);
          apiError = fetchError;
          try {
            responseData = await apiClient.get<EnergyApiResponse>('/energy/recent');
          } catch (apiClientError) {
            console.error('API client also failed:', apiClientError);
            // Final fallback to the service
            try {
              const fallbackData = await energyLogService.getLedRecentEnergyData(deviceId, ledId);
              setRecentData(fallbackData);
              
              // Create simplified daily data from fallback
              const totalEnergyToday = fallbackData.totalEnergyWh / 1000; // Convert to kWh
              const costPerKwh = 0.15;
              const totalCostToday = totalEnergyToday * costPerKwh;
              
              setDailyData({
                totalEnergyWh: fallbackData.totalEnergyWh,
                totalEnergyToday: totalEnergyToday,
                totalCostToday: totalCostToday,
                costPerKwh: costPerKwh,
                averagePowerW: fallbackData.totalPowerW,
                peakPowerW: 0,
                activeTimeMinutes: 0,
                costEstimate: totalCostToday,
                savingsEstimate: totalCostToday * 0.2,
                chartData: [] // No chart data available from fallback
              });
              
              setLoading(false);
              return; // Exit early since we've set all the data
            } catch (fallbackError) {
              console.error('All data fetching methods failed:', fallbackError);
              throw new Error('Failed to fetch energy data after all attempts');
            }
          }
        }
        
        console.info('Processing API response:', responseData);
        
        // Normalize the data to match our expected format
        const recentEnergyData: RecentEnergySummary = {
          totalEnergyWh: responseData.data?.total_energy_wh || 0,
          totalPowerW: responseData.data?.total_power_w || 0,
          uniqueDevices: responseData.data?.unique_devices || 0,
          uniqueLeds: responseData.data?.unique_leds || 0,
          startTime: responseData.data?.start_time || new Date().toISOString(),
          endTime: responseData.data?.end_time || new Date().toISOString(),
          minuteData: []
        };

        // Process minute data with proper validation
        if (responseData.data?.minute_data && Array.isArray(responseData.data.minute_data)) {
          console.info('Processing minute data, count:', responseData.data.minute_data.length);
          recentEnergyData.minuteData = responseData.data.minute_data
            .filter(item => item && typeof item === 'object')
            .map(item => {
              // Check if timestamp is valid
              let timestamp = item.timestamp;
              if (timestamp) {
                try {
                  // Handle time-only format (like "03:36")
                  if (/^\d{1,2}:\d{2}$/.test(timestamp)) {
                    // It's a time-only value, add today's date
                    const today = new Date();
                    const [hours, minutes] = timestamp.split(':').map(Number);
                    today.setHours(hours, minutes, 0, 0);
                    timestamp = today.toISOString();
                    console.debug('Converted time-only value:', item.timestamp, 'to', timestamp);
                  } else {
                    // Try to parse as normal timestamp
                    const testDate = new Date(timestamp);
                    if (isNaN(testDate.getTime())) {
                      console.warn('Invalid timestamp format:', timestamp);
                      timestamp = new Date().toISOString(); // Fallback to current time
                    }
                  }
                } catch (e) {
                  console.warn('Error validating timestamp:', e);
                  timestamp = new Date().toISOString(); // Fallback to current time
                }
              } else {
                timestamp = new Date().toISOString(); // Fallback for missing timestamp
              }

              return {
                timestamp,
                energyWh: typeof item.energy_wh === 'number' ? item.energy_wh : 0,
                powerW: typeof item.power_w === 'number' ? item.power_w : 0
              };
            });
        } else {
          console.warn('Invalid or missing minute_data in API response');
        }
        
        setRecentData(recentEnergyData);
        
        // Create daily summary from recent data
        if (recentEnergyData && recentEnergyData.minuteData && recentEnergyData.minuteData.length > 0) {
          const totalEnergyToday = recentEnergyData.totalEnergyWh / 1000; // Convert Wh to kWh
          const costPerKwh = 0.15; // Assuming $0.15 per kWh
          const totalCostToday = totalEnergyToday * costPerKwh;
          
          console.info('Creating hourly data from', recentEnergyData.minuteData.length, 'minute data points');
          
          // Group data by hour for daily view
          const hourlyData: Record<string, HourlyDataItem> = recentEnergyData.minuteData.reduce((acc, item) => {
            // Skip invalid timestamps
            if (!item.timestamp) return acc;
            
            try {
              let date: Date;
              
              // Handle time-only format (like "03:36") - but this shouldn't happen now as we've already processed
              if (/^\d{1,2}:\d{2}$/.test(item.timestamp)) {
                // It's a time-only value, add today's date
                date = new Date();
                const [hours, minutes] = item.timestamp.split(':').map(Number);
                date.setHours(hours, minutes, 0, 0);
              } else {
                // Try to parse as normal timestamp
                date = new Date(item.timestamp);
              }
              
              // Check if date is valid before proceeding
              if (isNaN(date.getTime())) {
                console.warn('Invalid timestamp in hourly data processing:', item.timestamp);
                return acc;
              }
              
              const hourKey = date.toLocaleString([], { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit'
              });
              
              if (!acc[hourKey]) {
                // Format date safely
                let dateStr = '';
                try {
                  dateStr = date.toISOString().split('T')[0];
                } catch (e) {
                  console.warn('Error formatting date:', e);
                  dateStr = new Date().toISOString().split('T')[0]; // Fallback to current date
                }
                
                acc[hourKey] = {
                  date: dateStr,
                  hour: date.getHours(),
                  energy: 0,
                  cost: 0
                };
              }
              
              const energyKwh = item.energyWh / 1000;
              acc[hourKey].energy += energyKwh;
              acc[hourKey].cost += energyKwh * costPerKwh;
            } catch (error) {
              console.warn('Error processing timestamp:', item.timestamp, error);
            }
            
            return acc;
          }, {} as Record<string, HourlyDataItem>);
          
          // Make sure we have valid hourly data before setting chart data
          const hourlyDataValues = Object.values(hourlyData);
          console.info('Created', hourlyDataValues.length, 'hourly data points');
          
          setDailyData({
            totalEnergyWh: recentEnergyData.totalEnergyWh,
            totalEnergyToday: totalEnergyToday,
            totalCostToday: totalCostToday,
            costPerKwh: costPerKwh,
            averagePowerW: recentEnergyData.totalPowerW / (recentEnergyData.minuteData.length || 1),
            // Safely calculate peak power with fallback
            peakPowerW: recentEnergyData.minuteData.length > 0 
              ? Math.max(...recentEnergyData.minuteData
                  .map(d => typeof d.powerW === 'number' ? d.powerW : 0)
                  .filter(p => !isNaN(p) && isFinite(p)),
                0)
              : 0,
            activeTimeMinutes: recentEnergyData.minuteData.length,
            costEstimate: totalCostToday,
            savingsEstimate: totalCostToday * 0.2,
            chartData: hourlyDataValues.length > 0 
              ? hourlyDataValues.map(item => ({
                  date: item.date,
                  hour: item.hour,
                  energy: Number(item.energy.toFixed(6)),
                  cost: Number(item.cost.toFixed(2))
                }))
              : [] // Provide empty array if no hourly data exists
          });
        } else {
          console.warn('No valid minute data to process for daily summary');
          // Set empty daily data with zeros
          setDailyData({
            totalEnergyWh: 0,
            totalEnergyToday: 0,
            totalCostToday: 0,
            costPerKwh: 0.15,
            averagePowerW: 0,
            peakPowerW: 0,
            activeTimeMinutes: 0,
            costEstimate: 0,
            savingsEstimate: 0,
            chartData: []
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching energy data:", err);
        setError("Failed to load energy data");
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up polling to refresh data every minute
    const intervalId = setInterval(() => {
      fetchData();
    }, 60000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Format chart data based on active tab
  const getChartData = () => {
    if (activeTab === "minutes" && recentData?.minuteData) {
      return recentData.minuteData.map(item => ({
        name: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        energy: Number((item.energyWh / 1000).toFixed(6)), // Convert Wh to kWh
        power: Number(item.powerW.toFixed(2))
      }));
    }
    
    if (activeTab === "daily" && dailyData?.chartData) {
      return dailyData.chartData.map(item => ({
        name: new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        energy: Number(item.energy.toFixed(6)),
        cost: Number(item.cost.toFixed(2))
      }));
    }
    
    return [];
  };
  
  // Calculate daily totals
  const totalEnergyToday = dailyData?.totalEnergyToday || 0;
  const totalCostToday = dailyData?.totalCostToday || 0;
  const costPerKwh = dailyData?.costPerKwh || 0.15;

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Loading energy data...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Error loading energy data</CardDescription>
        </CardHeader>
        <CardContent className="p-8 text-center text-muted-foreground">
          {error}. Using fallback data.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Power consumption overview and history</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="overflow-hidden border-l-4 border-yellow-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Total Usage (Today)
                  </div>
                  <Zap className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="flex items-baseline">
                  <div className="text-2xl font-bold">{totalEnergyToday.toFixed(6)}</div>
                  <div className="ml-1 text-sm font-medium text-muted-foreground">kWh</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border-l-4 border-green-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Estimated Cost (Today)
                  </div>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-baseline">
                  <div className="text-2xl font-bold">${totalCostToday.toFixed(2)}</div>
                </div>
                <div className="flex items-center mt-2">
                  <div className="text-xs text-muted-foreground">
                    Based on <span className="font-medium">${costPerKwh}/kWh</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="minutes">Minutes</TabsTrigger>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="h-[400px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getChartData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid.stroke} />
                  <XAxis 
                    dataKey="name" 
                    stroke={chartColors.axes.stroke} 
                    tick={{ fill: chartColors.axes.tick, fontSize: chartColors.axes.fontSize }}
                  />
                  <YAxis 
                    stroke={chartColors.axes.stroke} 
                    tick={{ fill: chartColors.axes.tick, fontSize: chartColors.axes.fontSize }}
                    tickFormatter={(value) => `${value.toFixed(4)}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartColors.tooltip.background, 
                      border: `1px solid ${chartColors.tooltip.border}`,
                      borderRadius: '6px',
                      color: chartColors.tooltip.textColor
                    }}
                    formatter={(value: number) => [`${value.toFixed(6)}`, null]}
                  />
                  <Legend iconType="circle" />
                  <Area 
                    type="monotone" 
                    dataKey="energy" 
                    name="Energy (kWh)" 
                    stroke={chartColors.energy.stroke} 
                    fill={chartColors.energy.fill} 
                    fillOpacity={0.2}
                    strokeWidth={chartColors.energy.strokeWidth}
                    activeDot={{ r: 6, stroke: chartColors.energy.stroke, strokeWidth: 1, fill: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cost" 
                    name="Cost ($)" 
                    stroke={chartColors.cost.stroke} 
                    fill={chartColors.cost.fill} 
                    fillOpacity={0.1}
                    strokeWidth={chartColors.cost.strokeWidth}
                    activeDot={{ r: 6, stroke: chartColors.cost.stroke, strokeWidth: 1, fill: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="minutes" className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getChartData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid.stroke} />
                  <XAxis 
                    dataKey="name" 
                    stroke={chartColors.axes.stroke} 
                    tick={{ fill: chartColors.axes.tick, fontSize: chartColors.axes.fontSize }}
                  />
                  <YAxis 
                    stroke={chartColors.axes.stroke} 
                    tick={{ fill: chartColors.axes.tick, fontSize: chartColors.axes.fontSize }}
                    tickFormatter={(value) => `${value.toFixed(4)}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartColors.tooltip.background, 
                      border: `1px solid ${chartColors.tooltip.border}`,
                      borderRadius: '6px',
                      color: chartColors.tooltip.textColor
                    }}
                    formatter={(value: number) => [`${value.toFixed(6)}`, null]}
                  />
                  <Legend iconType="circle" />
                  <Area 
                    type="monotone" 
                    dataKey="energy" 
                    name="Energy (kWh)" 
                    stroke={chartColors.energy.stroke} 
                    fill={chartColors.energy.fill} 
                    fillOpacity={0.2}
                    strokeWidth={chartColors.energy.strokeWidth}
                    activeDot={{ r: 6, stroke: chartColors.energy.stroke, strokeWidth: 1, fill: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="power" 
                    name="Power (W)" 
                    stroke={chartColors.power.stroke} 
                    fill={chartColors.power.fill} 
                    fillOpacity={0.1}
                    strokeWidth={chartColors.power.strokeWidth}
                    activeDot={{ r: 6, stroke: chartColors.power.stroke, strokeWidth: 1, fill: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="weekly" className="h-[400px]">
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <Sparkles className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-medium">Weekly Data Coming Soon</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Weekly energy analysis will be available in a future update
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="monthly" className="h-[400px]">
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <Sparkles className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-medium">Monthly Data Coming Soon</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Monthly energy analysis will be available in a future update
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}