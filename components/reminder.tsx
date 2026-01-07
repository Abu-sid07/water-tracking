"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { ReminderSettings } from "@/components/reminder-settings"

interface ReminderProps {
  isEnabled: boolean
  interval: number
  onToggle: (v: boolean) => void
  onIntervalChange: (n: number) => void
  reminderTimer: any
}

export default function Reminder({ isEnabled, interval, onToggle, onIntervalChange, reminderTimer }: ReminderProps) {
  return (
    <>
      <ReminderSettings isEnabled={isEnabled} interval={interval} onToggle={onToggle} onIntervalChange={onIntervalChange} />

      {isEnabled && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Next reminder</p>
                  <p className="text-xs text-muted-foreground">{reminderTimer.formatTimeRemaining()}</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
