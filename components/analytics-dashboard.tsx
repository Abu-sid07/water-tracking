"use client"


import { useState, useMemo } from "react"
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
import {
  Calendar,
  TrendingUp,
  Droplets,
  Target,
  Award,
  Clock,
  ArrowUp,
  ArrowDown,
  Save,
  CalendarDays,
  Loader2,
} from "lucide-react"
import { useWaterHistory } from "@/hooks/use-water-history"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

interface AnalyticsDashboardProps {
  dailyGoal: number
  onClose: () => void
  history: any[]
  getDailyStats: (days: number, goalOverride?: number) => any[]
  getWeeklyStats: (weeks: number, goalOverride?: number) => any[]
  getCurrentStreak: (goalOverride?: number) => number
  isLoading?: boolean
}

export function AnalyticsDashboard({ 
  dailyGoal, 
  onClose,
  history,
  getDailyStats,
  getWeeklyStats,
  getCurrentStreak,
  isLoading = false
}: AnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"7" | "30" | "90">("30")
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split("T")[0]
  })

  // ─────────────────────────────────────────────────────────────────────────
  // FIX #1 — useMutation always at top level (NOT inside handleSaveAnalytics)
  // ─────────────────────────────────────────────────────────────────────────
  const saveAnalyticsMutation = useMutation(api.analytics.saveAnalytics)

  // ─────────────────────────────────────────────────────────────────────────
  // FIX #4 — Pass dailyGoal prop into getDailyStats / getWeeklyStats / streak
  // ─────────────────────────────────────────────────────────────────────────
  const allDailyStats = useMemo(() => 
    getDailyStats(Number.parseInt(selectedPeriod), dailyGoal),
    [getDailyStats, selectedPeriod, dailyGoal]
  )

  // ─────────────────────────────────────────────────────────────────────────
  // FIX #5 — Filter by startDate so the date picker actually works
  // ─────────────────────────────────────────────────────────────────────────
  const dailyStats = useMemo(() => 
    allDailyStats.filter((day) => day.date >= startDate),
    [allDailyStats, startDate]
  )

  const weeklyStats  = useMemo(() => 
    getWeeklyStats(4, dailyGoal),
    [getWeeklyStats, dailyGoal]
  )
  
  const currentStreak = useMemo(() => 
    getCurrentStreak(dailyGoal),
    [getCurrentStreak, dailyGoal]
  )

  // ── Overall statistics ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    const hasData            = dailyStats.length > 0
    const totalDays          = hasData ? dailyStats.length : 1 // guard divide-by-zero
    const daysGoalReached    = dailyStats.filter((day) => day.goalReached).length
    
    // Fix: Filter only days with intake for average daily intake calculation
    const activeDays = dailyStats.filter(day => day.totalIntake > 0)
    const averageDailyIntake = activeDays.length > 0
      ? Math.round(activeDays.reduce((sum, day) => sum + day.totalIntake, 0) / activeDays.length)
      : 0
    
    const bestDay = hasData
      ? dailyStats.reduce(
          (best, day) => (day.totalIntake > best.totalIntake ? day : best),
          dailyStats[0]
        )
      : null
    
    const goalCompletionRate = hasData
      ? Math.round((daysGoalReached / dailyStats.length) * 100)
      : 0

    return {
      hasData,
      totalDays,
      daysGoalReached,
      averageDailyIntake,
      bestDay,
      goalCompletionRate
    }
  }, [dailyStats])

  const { hasData, totalDays, daysGoalReached, averageDailyIntake, bestDay, goalCompletionRate } = stats

  // ── Chart data ───────────────────────────────────────────────────────────
  const chartData = useMemo(() => 
    dailyStats
      .slice(0, 14)
      .reverse()
      .map((day) => ({
        // Fix: Use local date formatting for x-axis
        date: new Date(day.date).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        }),
        intake: day.totalIntake,
        goal: day.goal || dailyGoal || 2000,
        percentage: day.goal > 0 ? Math.round((day.totalIntake / day.goal) * 100) : 0,
      })),
    [dailyStats, dailyGoal]
  )

  const weeklyChartData = useMemo(() => 
    weeklyStats.reverse().map((week, index) => ({
      week: `W${index + 1}`,
      average: week.averageIntake,
      goal: dailyGoal || 2000,
      completion: week.totalDays > 0 ? Math.round((week.daysGoalReached / week.totalDays) * 100) : 0,
    })),
    [weeklyStats, dailyGoal]
  )

  // ── Loading Guard ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton for Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-muted rounded" />
                    <div className="h-6 w-12 bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Skeleton for Main Chart */}
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-48 bg-muted rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full bg-muted rounded-lg" />
          </CardContent>
        </Card>
      </div>
    )
  }


  // ─────────────────────────────────────────────────────────────────────────
  // FIX #1 — useMutation result used here (no hook inside function body)
  // ─────────────────────────────────────────────────────────────────────────
  const handleSaveAnalytics = async () => {
    const analyticsData = {
      startDate,
      selectedPeriod,
      dailyStats,
      weeklyStats,
      currentStreak,
      timestamp: new Date().toISOString(),
    }

    try {
      const currentUser = localStorage.getItem("currentUser")
      if (currentUser) {
        const parsed = JSON.parse(currentUser) as any
        if (parsed.convexId) {
          await saveAnalyticsMutation({
            userId: parsed.convexId,
            startDate,
            period: selectedPeriod,
            payload: JSON.stringify(analyticsData),
          })
          alert("Analytics data saved successfully!")
          return
        }
      }
    } catch (e) {
      console.warn("Failed to save analytics to Convex:", e)
    }

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
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground font-semibold">
            <CalendarDays className="h-5 w-5 text-primary" />
            Analytics Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="space-y-1.5 flex-1 w-full sm:w-auto">
              <Label htmlFor="start-date" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Start Date
              </Label>
              <div className="relative">
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm bg-background border-muted-foreground/20 focus:border-primary h-9 transition-colors"
                />
              </div>
            </div>
            
            <div className="space-y-1.5 flex-1 w-full sm:w-auto">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Time Period
              </Label>
              <Select
                value={selectedPeriod}
                onValueChange={(value: "7" | "30" | "90") => {
                  setSelectedPeriod(value)
                  const date = new Date()
                  date.setDate(date.getDate() - Number.parseInt(value))
                  setStartDate(date.toISOString().split("T")[0])
                }}
              >
                <SelectTrigger className="text-sm bg-background border-muted-foreground/20 h-9 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSaveAnalytics} 
              variant="outline"
              size="sm"
              className="h-9 w-full sm:w-auto px-4 border-primary/20 hover:bg-primary/5 text-primary transition-all"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Droplets className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground">Avg Daily Intake</p>
                <p className="text-xl font-bold text-foreground">
                  {averageDailyIntake}ml
                </p>
                <div className="flex items-center gap-1 text-xs">
                  {averageDailyIntake >= dailyGoal ? (
                    <ArrowUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-500" />
                  )}
                  <span
                    className={
                      averageDailyIntake >= dailyGoal
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {Math.round((averageDailyIntake / dailyGoal) * 100)}%
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
                <p className="text-xl font-bold text-foreground">
                  {goalCompletionRate}%
                </p>
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
                <p className="text-xl font-bold text-foreground">
                  {currentStreak} days
                </p>
                <Badge variant="secondary" className="text-xs">
                  {currentStreak >= 7
                    ? "Amazing!"
                    : currentStreak >= 3
                    ? "Great!"
                    : "Keep going!"}
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
                <p className="text-xl font-bold text-foreground">
                  {bestDay?.totalIntake ?? 0}ml
                </p>
                <p className="text-xs text-foreground">
                  {bestDay
                    ? new Date(bestDay.date).toLocaleDateString()
                    : "No data"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily" className="text-foreground">
            Daily Intake
          </TabsTrigger>
          <TabsTrigger value="weekly" className="text-foreground">
            Weekly Average
          </TabsTrigger>
          <TabsTrigger value="progress" className="text-foreground">
            Progress Trend
          </TabsTrigger>
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
              <div className="h-48 sm:h-64 md:h-80">
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
              <div className="h-48 sm:h-64 md:h-80">
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
              {dailyStats.filter(d => d.intakeCount > 0).length < 3 ? (
                <div className="h-48 sm:h-64 md:h-80 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/20">
                  <TrendingUp className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-center px-4">
                    Add more days of water intake to see your progress trend
                  </p>
                </div>
              ) : (
                <div className="h-48 sm:h-64 md:h-80">
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5" />
            Recent Activity (Last 10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 pr-2">
            {(history.length > 0 ? history.slice(0, 10) : []).map((entry: any) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-primary/10 rounded-md">
                    <Droplets className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{entry.amount}ml</p>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1 uppercase tracking-tighter font-bold">
                        {entry.amount >= 500 ? "Large" : entry.amount >= 250 ? "Medium" : "Small"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      <span className="text-muted-foreground/30">•</span>
                      <Clock className="h-3 w-3" />
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                <Clock className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No activity recorded yet. <br /> Start tracking your water intake!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}