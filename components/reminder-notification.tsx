"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Clock, Droplets, X } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { useCustomSound } from "@/hooks/use-custom-sound"

interface ReminderNotificationProps {
  isVisible: boolean
  onDismiss: () => void
  onSnooze: (minutes: number) => void
  onDrinkWater: () => void
}

export function ReminderNotification({ isVisible, onDismiss, onSnooze, onDrinkWater }: ReminderNotificationProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const { showNotification, permission } = useNotifications()
  const { playNotificationSound } = useCustomSound()

  useEffect(() => {
    if (isVisible) {
      setIsPlaying(true)
      playNotificationSound()
      setTimeout(() => setIsPlaying(false), 1000)

      // Show browser notification
      if (permission.granted) {
        showNotification("Time to Drink Water!", {
          body: "Stay hydrated! It's time for your next glass of water.",
          icon: "/favicon.ico",
          tag: "water-reminder",
        })
      }
    }
  }, [isVisible, permission.granted, showNotification, playNotificationSound])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-primary shadow-2xl animate-in zoom-in-95 duration-200">
        <CardContent className="p-6 text-center space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Droplets className="h-6 w-6 text-primary" />
              </div>
              <Badge variant="secondary" className="animate-pulse">
                Reminder
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onDismiss} className="h-8 w-8 p-0 text-white dark:text-white dark:hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-primary">Time to Drink Water!</h3>
            <p className="text-muted-foreground">Stay hydrated! It's time for your next glass of water.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={onDrinkWater} className="w-full bg-primary text-white hover:bg-primary/90 dark:text-white dark:hover:text-white" size="lg">
              <Droplets className="h-4 w-4 mr-2" />I Drank Water
            </Button>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={() => onSnooze(5)} size="sm">
                <Clock className="h-3 w-3 mr-1" />
                5m
              </Button>
              <Button variant="outline" onClick={() => onSnooze(10)} size="sm">
                <Clock className="h-3 w-3 mr-1" />
                10m
              </Button>
              <Button variant="outline" onClick={() => onSnooze(15)} size="sm">
                <Clock className="h-3 w-3 mr-1" />
                15m
              </Button>
            </div>
          </div>

          {isPlaying && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Bell className="h-4 w-4 animate-pulse" />
              Playing notification sound...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
