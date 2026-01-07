"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge" 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts"
import { Calendar, TrendingUp, Droplets, Target, Award, Clock, ArrowUp, ArrowDown, Save, CalendarDays } from "lucide-react"
import { useWaterHistory } from "@/hooks/use-water-history"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

interface AnalyticsDashboardProps {
  dailyGoal: number
  onClose: () => void
}

export function AnalyticsDashboard({ dailyGoal, onClose }: AnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"7" | "30" | "90">("30")
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split('T')[0]
  })
  const { getDailyStats, getWeeklyStats, getCurrentStreak, history } = useWaterHistory()

  const dailyStats = getDailyStats(Number.parseInt(selectedPeriod))
  const weeklyStats = getWeeklyStats(4)
  const currentStreak = getCurrentStreak()

  // Calculate overall statistics
  const totalDays = dailyStats.length
  const daysGoalReached = dailyStats.filter((day) => day.goalReached).length
  const averageDailyIntake = Math.round(dailyStats.reduce((sum, day) => sum + day.totalIntake, 0) / totalDays)
  const bestDay = dailyStats.reduce((best, day) => (day.totalIntake > best.totalIntake ? day : best), dailyStats[0])
  const goalCompletionRate = Math.round((daysGoalReached / totalDays) * 100)

  // Prepare chart data
  const chartData = dailyStats
    .slice(0, 14)
    .reverse()
    .map((day) => ({
      date: new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      intake: day.totalIntake,
      goal: day.goal,
      percentage: Math.round((day.totalIntake / day.goal) * 100),
    }))

  const weeklyChartData = weeklyStats.reverse().map((week, index) => ({
    week: `W${index + 1}`,
    average: week.averageIntake,
    goal: dailyGoal,
    completion: Math.round((week.daysGoalReached / week.totalDays) * 100),
  }))

  const handleSaveAnalytics = () => {
    // Save analytics data to Convex
    const analyticsData = {
      startDate,
      selectedPeriod,
      dailyStats,
      weeklyStats,
      currentStreak,
      timestamp: new Date().toISOString(),
    }
    
    // If a Convex user is logged in, call mutation
    try {
      const currentUser = localStorage.getItem("currentUser")
      if (currentUser) {
        const parsed = JSON.parse(currentUser) as any
        if (parsed.convexId) {
          const saveAnalytics = useMutation(api.analytics.saveAnalytics)
          // Fire and forget
          saveAnalytics({ userId: parsed.convexId, startDate, period: selectedPeriod, payload: JSON.stringify(analyticsData) })
          alert("Analytics data saved successfully!")
          return
        }
      }
    } catch (e) {
      console.warn("Failed to save analytics to Convex:", e)
    }

    // Fallback: log to console
    console.log("Saving analytics data (local):", analyticsData)
    alert("Analytics data saved (local)")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <TrendingUp className="h-6 w-6 text-primary" />
            Analytics Dashboard
          </h2>
          <p className="text-foreground">Track your hydration patterns and progress</p>
        </div>
      </div>

      {/* Analytics Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CalendarDays className="h-5 w-5" />
            Analytics Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-foreground">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Period</Label>
              <Select value={selectedPeriod} onValueChange={(value: "7" | "30" | "90") => setSelectedPeriod(value)}>
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Actions</Label>
              <Button onClick={handleSaveAnalytics} className="w-full" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Droplets className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground">Avg Daily Intake</p>
                <p className="text-xl font-bold text-foreground">{averageDailyIntake}ml</p>
                <div className="flex items-center gap-1 text-xs">
                  {averageDailyIntake >= dailyGoal ? (
                    <ArrowUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={averageDailyIntake >= dailyGoal ? "text-green-500" : "text-red-500"}>
                    {Math.round((averageDailyIntake / dailyGoal) * 100)}% of goal
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Target className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-foreground">Goal Completion</p>
                <p className="text-xl font-bold text-foreground">{goalCompletionRate}%</p>
                <p className="text-xs text-foreground">
                  {daysGoalReached} of {totalDays} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Award className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-foreground">Current Streak</p>
                <p className="text-xl font-bold text-foreground">{currentStreak} days</p>
                <Badge variant="secondary" className="text-xs">
                  {currentStreak >= 7 ? "Amazing!" : currentStreak >= 3 ? "Great!" : "Keep going!"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-1/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-foreground">Best Day</p>
                <p className="text-xl font-bold text-foreground">{bestDay?.totalIntake || 0}ml</p>
                <p className="text-xs text-foreground">
                  {bestDay ? new Date(bestDay.date).toLocaleDateString() : "No data"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily" className="text-foreground">Daily Intake</TabsTrigger>
          <TabsTrigger value="weekly" className="text-foreground">Weekly Average</TabsTrigger>
          <TabsTrigger value="progress" className="text-foreground">Progress Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Calendar className="h-5 w-5" />
                Daily Water Intake (Last 14 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-foreground" />
                    <YAxis className="text-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Bar dataKey="goal" fill="#6b7280" name="Goal" />
                    <Bar dataKey="intake" fill="#3b82f6" name="Actual Intake" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <TrendingUp className="h-5 w-5" />
                Weekly Average Intake
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" className="text-foreground" />
                    <YAxis className="text-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="goal"
                      stroke="#6b7280"
                      strokeDasharray="5 5"
                      name="Goal"
                    />
                    <Line
                      type="monotone"
                      dataKey="average"
                      stroke="#91ad00"
                      strokeWidth={3}
                      name="Average Intake"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Award className="h-5 w-5" />
                Goal Achievement Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-foreground" />
                    <YAxis className="text-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="percentage"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      name="Goal Achievement %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {(history.length > 0 ? history.slice(0, 10) : (() => {
              try {
                const raw = localStorage.getItem('recentActivity')
                return raw ? JSON.parse(raw) : []
              } catch (e) {
                return []
              }
            })()).map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-primary/10 rounded">
                    <Droplets className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{entry.amount}ml</p>
                    <p className="text-xs text-foreground">
                      {new Date(entry.timestamp).toLocaleDateString()} at{" "}
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {entry.amount >= 500 ? "Large" : entry.amount >= 250 ? "Medium" : "Small"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
