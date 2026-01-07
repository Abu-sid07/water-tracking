"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, BellOff, Clock, Volume2, AlarmClock, Plus, X, BarChart, Settings } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { useCustomSound } from "@/hooks/use-custom-sound"
import { useEffect } from "react"
interface AlarmTime {
  id: string
  time: string
  enabled: boolean
}

interface ReminderSettingsProps {
  isEnabled: boolean
  interval: number // minutes
  onToggle: (enabled: boolean) => void
  onIntervalChange: (interval: number) => void
}

export function ReminderSettings({ isEnabled, interval, onToggle, onIntervalChange }: ReminderSettingsProps) {
  const { permission, requestPermission, isSupported } = useNotifications()
  const [testingSound, setTestingSound] = useState(false)
  const [alarms, setAlarms] = useState<AlarmTime[]>([
  { id: "1", time: "07:00", enabled: true }, // right after waking up
  { id: "2", time: "09:00", enabled: true },
  { id: "3", time: "11:00", enabled: true },
  { id: "4", time: "13:00", enabled: true }, // before/after lunch
  { id: "5", time: "15:00", enabled: true },
  { id: "6", time: "17:00", enabled: true },
  { id: "7", time: "19:00", enabled: true }, // before dinner
  { id: "8", time: "21:00", enabled: true }  // before bed (small sip)
])

  const testNotificationSound = () => {
    setTestingSound(true)
    try {
      // Prefer the shared player (will play custom sound or fallback)
      playNotificationSound()
    } catch (e) {
      // ignore
    }
    // reset the testing state after a short delay
    setTimeout(() => setTestingSound(false), 700)
  }

  const { customSoundUrl, playNotificationSound } = useCustomSound()
  const { showNotification } = useNotifications()

  // Scheduler: check every 30 seconds for alarms matching current time (HH:MM)
  // Alarms (exact HH:MM matching) — keep polling frequently to catch minute transitions
  useEffect(() => {
    if (typeof window === "undefined") return
      const pollId = setInterval(() => {
      const now = new Date()
      const hhmm = now.toTimeString().slice(0, 5)

      alarms.forEach((alarm) => {
        if (!alarm.enabled) return
        if (alarm.time === hhmm) {
            try { playNotificationSound() } catch (e) {}
            showNotification("Hydration Reminder", {
              body: `Time to drink water — ${alarm.time}`,
            })
        }
      })
    }, 30 * 1000)

    return () => clearInterval(pollId)
  }, [alarms, customSoundUrl, showNotification])

  // Interval-based reminders: use provided interval (minutes) and the isEnabled prop
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!isEnabled) return

    const ms = Math.max(1, interval) * 60 * 1000
    const id = setInterval(() => {
      // play sound and show notification
      try { playNotificationSound() } catch (e) {}
      showNotification("Hydration Reminder", {
        body: `Time to drink water — interval reminder (${interval} min)`,
      })
    }, ms)

    return () => clearInterval(id)
  }, [isEnabled, interval, customSoundUrl, showNotification])

  const addAlarm = () => {
    const newAlarm: AlarmTime = {
      id: Date.now().toString(),
      time: "12:00",
      enabled: true,
    }
    setAlarms([...alarms, newAlarm])
  }

  const removeAlarm = (id: string) => {
    setAlarms(alarms.filter(alarm => alarm.id !== id))
  }

  const updateAlarm = (id: string, updates: Partial<AlarmTime>) => {
    setAlarms(alarms.map(alarm => 
      alarm.id === id ? { ...alarm, ...updates } : alarm
    ))
  }

  const intervalOptions = [
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
  ]

  return (
    <div className="space-y-6">
      <Tabs defaultValue="timing" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timing" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timing
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Daily Progress
          </TabsTrigger>
        </TabsList>

        {/* Timing Tab */}
        <TabsContent value="timing" className="space-y-6">
          {/* Interval-based Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isEnabled ? (
                  <Clock className="h-5 w-5 text-primary" />
                ) : (
                  <Clock className="h-5 w-5 text-muted-foreground" />
                )}
                Interval Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Reminders */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="reminder-toggle">Water Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get notified at regular intervals</p>
                </div>
                <Switch id="reminder-toggle" checked={isEnabled} onCheckedChange={onToggle} />
              </div>

              {/* Reminder Interval */}
              <div className="space-y-2">
                <Label>Reminder Interval</Label>
                <Select
                  value={interval.toString()}
                  onValueChange={(value) => onIntervalChange(Number.parseInt(value))}
                  disabled={!isEnabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    {intervalOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Next Reminder Time - Editable */}
              <div className="space-y-2">
                <Label>Next Reminder Time</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="time"
                    value={(() => {
                      const now = new Date()
                      const nextReminder = new Date(now.getTime() + interval * 60 * 1000)
                      return nextReminder.toTimeString().slice(0, 5)
                    })()}
                    onChange={(e) => {
                      // Calculate new interval based on selected time
                      const now = new Date()
                      const selectedTime = new Date()
                      const [hours, minutes] = e.target.value.split(':')
                      selectedTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
                      
                      if (selectedTime <= now) {
                        selectedTime.setDate(selectedTime.getDate() + 1)
                      }
                      
                      const newInterval = Math.round((selectedTime.getTime() - now.getTime()) / (1000 * 60))
                      if (newInterval > 0) {
                        onIntervalChange(newInterval)
                      }
                    }}
                    className="w-32"
                    disabled={!isEnabled}
                  />
                  <span className="text-sm text-muted-foreground">
                    (Click to edit)
                  </span>
                </div>
              </div>

              {/* Current Status */}
              {isEnabled && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-medium">Next reminder in {interval} minutes</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alarm-based Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlarmClock className="h-5 w-5 text-accent" />
                Daily Alarms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {alarms.map((alarm) => (
                  <div key={alarm.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Input
                      type="time"
                      value={alarm.time}
                      onChange={(e) => updateAlarm(alarm.id, { time: e.target.value })}
                      className="w-32"
                    />
                    <Switch
                      checked={alarm.enabled}
                      onCheckedChange={(enabled) => updateAlarm(alarm.id, { enabled })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAlarm(alarm.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive dark:text-white dark:hover:text-destructive-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  onClick={addAlarm}
                  className="w-full bg-transparent"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Alarm
                </Button>
              </div>

              <div className="p-3 bg-accent/5 rounded-lg border border-accent/20">
                <div className="flex items-center gap-2 text-sm">
                  <AlarmClock className="h-4 w-4 text-accent" />
                  <span className="font-medium">
                    {alarms.filter(a => a.enabled).length} active alarms
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Browser Notifications</Label>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm">
                      {permission.granted && "Notifications enabled"}
                      {permission.denied && "Notifications blocked"}
                      {permission.default && "Notifications not configured"}
                    </p>
                    <div className="flex gap-2">
                      {permission.granted && (
                        <Badge variant="secondary" className="text-xs">
                          <Bell className="h-3 w-3 mr-1" />
                          Enabled
                        </Badge>
                      )}
                      {permission.denied && (
                        <Badge variant="destructive" className="text-xs">
                          <BellOff className="h-3 w-3 mr-1" />
                          Blocked
                        </Badge>
                      )}
                      {!isSupported && (
                        <Badge variant="outline" className="text-xs">
                          Not Supported
                        </Badge>
                      )}
                    </div>
                  </div>
                  {permission.default && isSupported && (
                    <Button variant="outline" size="sm" onClick={requestPermission}>
                      Enable
                    </Button>
                  )}
                </div>
              </div>

              {/* Test Sound */}
              <div className="space-y-2">
                <Label>Notification Sound</Label>
                <Button
                  variant="outline"
                  onClick={testNotificationSound}
                  disabled={testingSound}
                  className="w-full bg-transparent"
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  {testingSound ? "Playing..." : "Test Sound"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Progress Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Reminder Effectiveness</h4>
                  <p className="text-sm text-muted-foreground">
                    Track how reminders help you stay on track with your daily water goals.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {alarms.filter(a => a.enabled).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Active Alarms</div>
                  </div>
                  <div className="text-center p-3 bg-accent/5 rounded-lg">
                    <div className="text-2xl font-bold text-accent">
                      {isEnabled ? "On" : "Off"}
                    </div>
                    <div className="text-xs text-muted-foreground">Interval Reminders</div>
                  </div>
                </div>

                <div className="p-3 bg-secondary/5 rounded-lg border border-secondary/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Settings className="h-4 w-4 text-secondary" />
                    <span className="font-medium">Settings Summary</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <div>• Interval: {interval} minutes</div>
                    <div>• Alarms: {alarms.filter(a => a.enabled).length} set</div>
                    <div>• Notifications: {permission.granted ? "Enabled" : "Disabled"}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
