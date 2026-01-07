"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Droplets, Plus, Target, Clock, Trophy } from "lucide-react"

interface TrackerProps {
  todayWaterIntake: number
  dailyGoal: number
  userProfile?: any
  progressPercentage: number
  addWater: (amount: number) => void
  undoLastIntake?: () => void
  cupsCompleted: number
  totalCups: number
  lastDrinkTime: Date
  formatTimeAgo: (d: Date) => string
  streak: number
}

export default function Tracker({
  todayWaterIntake,
  dailyGoal,
  userProfile,
  progressPercentage,
  addWater,
  undoLastIntake,
  cupsCompleted,
  totalCups,
  lastDrinkTime,
  formatTimeAgo,
  streak,
}: TrackerProps) {
  return (
    <>
      {/* Main Tracker Card */}
      <Card className="relative overflow-hidden">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl text-primary">Daily Progress</CardTitle>
          <div className="text-3xl font-bold text-foreground">
            {todayWaterIntake} / {dailyGoal} ml
          </div>
          {userProfile && !userProfile.customGoal && (
            <p className="text-xs text-muted-foreground">
              Goal calculated from your profile ({userProfile.weight}kg, {userProfile.activityLevel} activity)
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Circular Progress Visualization + Controls (responsive) */}
          <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-6">
            <div className="relative w-36 h-36 sm:w-48 sm:h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted-foreground"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={282.74}
                  strokeDashoffset={282.74 * (1 - progressPercentage / 100)}
                  className="text-primary transition-all duration-500 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary">{Math.round(progressPercentage)}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            </div>

            {/* Right column: quick add + undo + progress (fills width on small screens) */}
            <div className="w-full max-w-lg">
              {/* Quick Add Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => addWater(250)}
                  className="h-12 sm:h-16 w-full flex flex-col gap-1 bg-primary text-white hover:bg-primary/90 hover:text-black dark:text-white dark:hover:text-white cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs">250ml</span>
                </Button>
                <Button
                  onClick={() => addWater(500)}
                  className="h-12 sm:h-16 w-full flex flex-col gap-1 bg-primary text-white hover:bg-primary/90 hover:text-black dark:text-white dark:hover:text-white cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs">500ml</span>
                </Button>
                <Button
                  onClick={() => addWater(750)}
                  className="h-12 sm:h-16 w-full flex flex-col gap-1 bg-primary text-white hover:bg-primary/90 hover:text-black dark:text-white dark:hover:text-white cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs">750ml</span>
                </Button>
              </div>

              {/* Undo Button */}
              <div className="flex justify-center mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => undoLastIntake && undoLastIntake()}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white dark:text-white dark:hover:text-white cursor-pointer"
                >
                  Undo Last
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    Cups: {cupsCompleted}/{totalCups}
                  </span>
                  <span>
                    {dailyGoal - todayWaterIntake > 0 ? `${dailyGoal - todayWaterIntake}ml to go` : "Goal reached!"}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last drink</p>
              <p className="font-semibold">{formatTimeAgo(lastDrinkTime)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Target className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Daily goal</p>
              <p className="font-semibold">{dailyGoal}ml</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Trophy className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Streak</p>
              <p className="font-semibold flex items-center gap-1">
                {streak} days
                <Badge variant="secondary" className="text-xs">
                  Hot!
                </Badge>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Preview */}
      {progressPercentage >= 100 && (
        <Card className="border-accent bg-accent/5">
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-accent mx-auto mb-2" />
            <h3 className="font-semibold text-accent">Daily Goal Achieved!</h3>
            <p className="text-sm text-muted-foreground">Great job staying hydrated today!</p>
          </CardContent>
        </Card>
      )}
    </>
  )
}
