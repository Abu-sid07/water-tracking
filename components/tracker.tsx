"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Droplets, Plus, Target, Clock, Trophy, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"

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
  isAdding?: boolean
  canUndo?: boolean
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
  isAdding = false,
  canUndo = false,
}: TrackerProps) {
  const [customAmount, setCustomAmount] = React.useState<string>("")
  const { toast } = useToast()

  const handleAddCustom = () => {
    const amount = parseInt(customAmount)
    if (isNaN(amount) || amount < 1 || amount > 5000) {
      toast({
        title: "Invalid amount",
        description: "Please enter a value between 1ml and 5000ml.",
        variant: "destructive",
      })
      return
    }
    addWater(amount)
    setCustomAmount("")
    toast({
      title: "Water added!",
      description: `${amount}ml has been added to your daily total.`,
    })
  }

  const handleQuickAdd = (amount: number) => {
    addWater(amount)
    toast({
      title: "Water added!",
      description: `${amount}ml has been added to your daily total.`,
    })
  }
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
            <div className="w-full max-w-lg space-y-4">
              {/* Quick Add Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => handleQuickAdd(250)}
                  disabled={isAdding}
                  className="h-12 sm:h-16 w-full flex flex-col gap-1 bg-primary text-white hover:bg-primary/90 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs">250ml</span>
                </Button>
                <Button
                  onClick={() => handleQuickAdd(500)}
                  disabled={isAdding}
                  className="h-12 sm:h-16 w-full flex flex-col gap-1 bg-primary text-white hover:bg-primary/90 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs">500ml</span>
                </Button>
                <Button
                  onClick={() => handleQuickAdd(750)}
                  disabled={isAdding}
                  className="h-12 sm:h-16 w-full flex flex-col gap-1 bg-primary text-white hover:bg-primary/90 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs">750ml</span>
                </Button>
              </div>

              {/* Manual Input */}
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Custom ml"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  min="1"
                  max="5000"
                  className="flex-1"
                />
                <Button 
                  onClick={handleAddCustom} 
                  disabled={isAdding || !customAmount}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  Add
                </Button>
              </div>

              {/* Undo Button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    undoLastIntake && undoLastIntake()
                    toast({
                      title: "Action undone",
                      description: "The last entry has been removed.",
                    })
                  }}
                  disabled={!canUndo}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Undo Last (30s)
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
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
