import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { apiClient } from "@/lib/api";
import { Badge } from "../ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

// Define types for debug data
interface DebugData {
  status: string;
  currentTime: string;
  timestamp: number;
  redis: {
    connected: boolean;
    message: string;
    status: string;
    onJobs: ScheduledJob[];
    offJobs: ScheduledJob[];
    fallbackJobs: FallbackJob[];
  };
  scheduler: {
    initialized: boolean;
    jobs: CronJob[];
  };
  databaseSchedules: DatabaseSchedule[];
}

interface ScheduledJob {
  id: string;
  data: {
    ledId: number;
    scheduleId: number;
  };
  timestamp: string;
  scheduledTime?: string;
  timeUntilExecution?: string;
  state: Record<string, unknown>;
}

interface FallbackJob {
  id: string;
  timestamp: Date;
  remainingMs: number;
}

interface CronJob {
  name: string;
  schedule: string;
  description: string;
}

interface DatabaseSchedule {
  id: number;
  ledId: number;
  deviceId: number;
  onTime: string;
  offTime: string;
  nextOnTime: string;
  nextOffTime: string;
  timeUntilNextOn: string;
  timeUntilNextOff: string;
  lastApplied: string;
  isDailySchedule: boolean;
  isActive: boolean;
}

export function ScheduleDebugger() {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const refreshDebugData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/arduino/schedules/debug');
      setDebugData(response as DebugData);
      setLastRefresh(new Date().toLocaleString());
    } catch (error) {
      setError(`Error fetching debug data: ${error instanceof Error ? error.message : String(error)}`);
      console.error("Schedule debug error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch debug data on component mount
    refreshDebugData();
    
    // Set up interval to refresh every 30 seconds
    const interval = setInterval(refreshDebugData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Format the data for display
  const formatJobId = (id: string) => {
    // Extract ledId and scheduleId from job ID (format: led-{ledId}-{on/off}-{scheduleId})
    const parts = id.split('-');
    if (parts.length >= 4) {
      const ledId = parts[1];
      const action = parts[2];
      const scheduleId = parts[3];
      return `LED ${ledId} ${action.toUpperCase()} (Schedule #${scheduleId})`;
    }
    return id;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Schedule Debugger</CardTitle>
        <CardDescription>
          Debug information for scheduled jobs
          {lastRefresh && <span className="ml-2 text-xs opacity-70">Last updated: {lastRefresh}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-center py-4">Loading debug data...</div>}
        {error && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        {debugData && (
          <Tabs defaultValue="schedules">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="schedules">Schedules</TabsTrigger>
              <TabsTrigger value="redis">Redis Jobs</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>
            
            <TabsContent value="schedules" className="space-y-4">
              <div className="text-sm">
                <p>Current Time: <strong>{debugData.currentTime}</strong></p>
                <p className="mb-4">Found <strong>{debugData.databaseSchedules?.length || 0}</strong> active schedules</p>
                
                <Accordion type="single" collapsible className="w-full">
                  {debugData.databaseSchedules?.map((schedule) => (
                    <AccordionItem key={schedule.id} value={`schedule-${schedule.id}`}>
                      <AccordionTrigger>
                        <span className="flex items-center gap-2">
                          <Badge variant={schedule.isActive ? "default" : "outline"}>
                            {schedule.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <span>
                            Schedule #{schedule.id} - LED {schedule.ledId}
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-4 space-y-1 text-sm">
                          <p>Device ID: <strong>{schedule.deviceId}</strong></p>
                          <p>On Time: <strong>{schedule.onTime}</strong> (Next: {schedule.nextOnTime})</p>
                          <p>Off Time: <strong>{schedule.offTime}</strong> (Next: {schedule.nextOffTime})</p>
                          <p>Time until ON: <strong>{schedule.timeUntilNextOn}</strong></p>
                          <p>Time until OFF: <strong>{schedule.timeUntilNextOff}</strong></p>
                          <p>Last Applied: <strong>{schedule.lastApplied}</strong></p>
                          <p>Daily Schedule: <strong>{schedule.isDailySchedule ? "Yes" : "No"}</strong></p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                
                {(!debugData.databaseSchedules || debugData.databaseSchedules.length === 0) && (
                  <div className="py-6 text-center text-muted-foreground">
                    No active schedules found in database
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="redis" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Redis Connection</h3>
                  <p>Status: <Badge variant={debugData.redis.connected ? "default" : "destructive"}>{debugData.redis.connected ? "Connected" : "Disconnected"}</Badge></p>
                  <p>Message: {debugData.redis.message}</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Pending ON Jobs ({debugData.redis.onJobs?.length || 0})</h3>
                  {debugData.redis.onJobs?.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {debugData.redis.onJobs.map((job) => (
                        <AccordionItem key={`on-${job.id}`} value={`on-${job.id}`}>
                          <AccordionTrigger>
                            {formatJobId(job.id)}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="pl-4 space-y-1">
                              <p>LED ID: <strong>{job.data?.ledId}</strong></p>
                              <p>Schedule ID: <strong>{job.data?.scheduleId}</strong></p>
                              <p>Scheduled Time: <strong>{job.scheduledTime}</strong></p>
                              <p>Time Until Execution: <strong>{job.timeUntilExecution}</strong></p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <p>No pending ON jobs</p>
                  )}
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Pending OFF Jobs ({debugData.redis.offJobs?.length || 0})</h3>
                  {debugData.redis.offJobs?.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {debugData.redis.offJobs.map((job) => (
                        <AccordionItem key={`off-${job.id}`} value={`off-${job.id}`}>
                          <AccordionTrigger>
                            {formatJobId(job.id)}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="pl-4 space-y-1">
                              <p>LED ID: <strong>{job.data?.ledId}</strong></p>
                              <p>Schedule ID: <strong>{job.data?.scheduleId}</strong></p>
                              <p>Scheduled Time: <strong>{job.scheduledTime}</strong></p>
                              <p>Time Until Execution: <strong>{job.timeUntilExecution}</strong></p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <p>No pending OFF jobs</p>
                  )}
                </div>
                
                {debugData.redis.status === 'fallback' && (
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Fallback Jobs ({debugData.redis.fallbackJobs?.length || 0})</h3>
                    {debugData.redis.fallbackJobs?.length > 0 ? (
                      <ul className="list-disc pl-5">
                        {debugData.redis.fallbackJobs.map((job, index) => (
                          <li key={`fallback-${index}`}>
                            {job.id} - {job.timestamp.toLocaleString()} ({Math.round(job.remainingMs / 1000)}s remaining)
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No fallback jobs</p>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="system" className="space-y-4">
              <div className="grid gap-4 text-sm">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">System Status</h3>
                  <p>Scheduler Initialized: <strong>{debugData.scheduler.initialized ? "Yes" : "No"}</strong></p>
                  <p>Cron Jobs: <strong>{debugData.scheduler.jobs?.length || 0}</strong></p>
                </div>
                
                {debugData.scheduler.jobs?.length > 0 && (
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Cron Jobs</h3>
                    <ul className="list-disc pl-5">
                      {debugData.scheduler.jobs.map((job, index) => (
                        <li key={`cron-${index}`}>
                          <strong>{job.name}</strong> - Schedule: {job.schedule} - {job.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Raw Debug Data</h3>
                  <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-[300px]">
                    {JSON.stringify(debugData, null, 2)}
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={refreshDebugData} disabled={loading}>
          {loading ? "Loading..." : "Refresh Data"}
        </Button>
        <Button 
          onClick={() => window.open('/arduino/schedules/debug', '_blank')} 
          variant="secondary"
        >
          View Raw JSON
        </Button>
      </CardFooter>
    </Card>
  );
} 