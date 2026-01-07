"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Star, Crown, Gem, Lock, Award, Target, Droplets, Calendar, Zap } from "lucide-react"
import type { Achievement, UserStats } from "@/hooks/use-achievements"

interface AchievementsGalleryProps {
  achievements: Achievement[]
  userStats: UserStats
  getProgressPercentage: (achievement: Achievement) => number
  onClose: () => void
}

const getAchievementIcon = (icon: string) => {
  const iconMap = {
    trophy: Trophy,
    star: Star,
    crown: Crown,
    gem: Gem,
    award: Award,
    target: Target,
    droplet: Droplets,
    calendar: Calendar,
    zap: Zap,
    "glass-water": Droplets,
    waves: Droplets,
    flame: Zap,
    "check-circle": Target,
    medal: Award,
  }
  return iconMap[icon as keyof typeof iconMap] || Trophy
}

const getRarityColor = (rarity: Achievement["rarity"]) => {
  switch (rarity) {
    case "common":
      return "border-gray-200 bg-gray-50 text-gray-700"
    case "rare":
      return "border-blue-200 bg-blue-50 text-blue-700"
    case "epic":
      return "border-purple-200 bg-purple-50 text-purple-700"
    case "legendary":
      return "border-yellow-200 bg-yellow-50 text-yellow-700"
    default:
      return "border-gray-200 bg-gray-50 text-gray-700"
  }
}

export function AchievementsGallery({
  achievements,
  userStats,
  getProgressPercentage,
  onClose,
}: AchievementsGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | Achievement["category"]>("all")

  const filteredAchievements =
    selectedCategory === "all" ? achievements : achievements.filter((a) => a.category === selectedCategory)

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalCount = achievements.length

  const categories = [
    { id: "all", label: "All", icon: Trophy },
    { id: "streak", label: "Streaks", icon: Calendar },
    { id: "daily", label: "Daily Goals", icon: Target },
    { id: "volume", label: "Volume", icon: Droplets },
    { id: "milestone", label: "Milestones", icon: Award },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Achievements
          </h2>
          <p className="text-muted-foreground">
            {unlockedCount} of {totalCount} achievements unlocked
          </p>
        </div>
      </div>

      {/* User Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{userStats.level}</div>
            <p className="text-sm text-muted-foreground">Level</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">{userStats.totalPoints}</div>
            <p className="text-sm text-muted-foreground">Total Points</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-secondary">{userStats.currentStreak}</div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-chart-1">{Math.round(userStats.totalWaterIntake / 1000)}L</div>
            <p className="text-sm text-muted-foreground">Total Water</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
        <TabsList className="grid w-full grid-cols-5">
          {categories.map((category) => {
            const IconComponent = category.icon
            return (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1">
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => {
              const IconComponent = getAchievementIcon(achievement.icon)
              const progress = getProgressPercentage(achievement)
              const rarityColor = getRarityColor(achievement.rarity)

              return (
                <Card
                  key={achievement.id}
                  className={`relative transition-all duration-200 ${
                    achievement.unlocked
                      ? `${rarityColor} border-2 shadow-md`
                      : "border-dashed opacity-60 hover:opacity-80"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${achievement.unlocked ? rarityColor : "bg-muted"}`}>
                        {achievement.unlocked ? (
                          <IconComponent className="h-6 w-6" />
                        ) : (
                          <Lock className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${achievement.unlocked ? rarityColor : ""}`}
                        >
                          {achievement.rarity}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {achievement.points} pts
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h3 className={`font-semibold ${achievement.unlocked ? "" : "text-muted-foreground"}`}>
                        {achievement.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>

                    {!achievement.unlocked && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>
                            {achievement.progress} / {achievement.requirement}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    {achievement.unlocked && achievement.unlockedAt && (
                      <div className="text-xs text-muted-foreground">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
