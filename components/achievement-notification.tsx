"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Crown, Gem, X, Sparkles } from "lucide-react"
import type { Achievement } from "@/hooks/use-achievements"

interface AchievementNotificationProps {
  achievements: Achievement[]
  onDismiss: () => void
}

const getAchievementIcon = (icon: string) => {
  switch (icon) {
    case "trophy":
      return Trophy
    case "star":
      return Star
    case "crown":
      return Crown
    case "gem":
      return Gem
    default:
      return Trophy
  }
}

const getRarityColor = (rarity: Achievement["rarity"]) => {
  switch (rarity) {
    case "common":
      return "text-gray-500 border-gray-200 bg-gray-50"
    case "rare":
      return "text-blue-500 border-blue-200 bg-blue-50"
    case "epic":
      return "text-purple-500 border-purple-200 bg-purple-50"
    case "legendary":
      return "text-yellow-500 border-yellow-200 bg-yellow-50"
    default:
      return "text-gray-500 border-gray-200 bg-gray-50"
  }
}

export function AchievementNotification({ achievements, onDismiss }: AchievementNotificationProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (achievements.length === 0) {
      setIsVisible(false)
      return
    }

    // Auto-advance through achievements
    if (achievements.length > 1 && currentIndex < achievements.length - 1) {
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [achievements.length, currentIndex])

  if (!isVisible || achievements.length === 0) return null

  const achievement = achievements[currentIndex]
  const IconComponent = getAchievementIcon(achievement.icon)
  const rarityColor = getRarityColor(achievement.rarity)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className={`w-full max-w-md border-2 shadow-2xl animate-in zoom-in-95 duration-300 ${rarityColor}`}>
        <CardContent className="p-6 text-center space-y-4 relative">
          {/* Celebration Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <Sparkles className="absolute top-2 left-2 h-4 w-4 text-yellow-400 animate-pulse" />
            <Sparkles className="absolute top-4 right-4 h-3 w-3 text-yellow-400 animate-pulse delay-100" />
            <Sparkles className="absolute bottom-4 left-4 h-3 w-3 text-yellow-400 animate-pulse delay-200" />
            <Sparkles className="absolute bottom-2 right-2 h-4 w-4 text-yellow-400 animate-pulse delay-300" />
          </div>

          {/* Close Button */}
          <Button variant="ghost" size="sm" onClick={onDismiss} className="absolute top-2 right-2 h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>

          {/* Achievement Icon */}
          <div className="flex justify-center">
            <div className={`p-4 rounded-full ${rarityColor} border-2`}>
              <IconComponent className="h-12 w-12" />
            </div>
          </div>

          {/* Achievement Details */}
          <div className="space-y-2">
            <Badge variant="secondary" className="text-xs font-medium">
              Achievement Unlocked!
            </Badge>
            <h3 className="text-xl font-bold">{achievement.title}</h3>
            <p className="text-muted-foreground text-sm">{achievement.description}</p>
          </div>

          {/* Rarity and Points */}
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className={`capitalize ${rarityColor}`}>
              {achievement.rarity}
            </Badge>
            <Badge variant="secondary">+{achievement.points} points</Badge>
          </div>

          {/* Progress Indicator */}
          {achievements.length > 1 && (
            <div className="flex justify-center gap-2">
              {achievements.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Action Button */}
          <Button onClick={onDismiss} className="w-full">
            {currentIndex < achievements.length - 1 ? "Next" : "Awesome!"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
