"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { User, Weight, Activity, Thermometer, Target, Calculator } from "lucide-react"

interface UserProfile {
  name: string
  email: string
  weight: number // kg
  activityLevel: "low" | "moderate" | "high"
  climate: "cool" | "moderate" | "hot"
  customGoal?: number // ml
}

interface UserProfileSetupProps {
  onComplete: (profile: UserProfile) => void
  onSkip: () => void
  initialProfile?: Partial<UserProfile>
}

export function UserProfileSetup({ onComplete, onSkip, initialProfile }: UserProfileSetupProps) {
  const [profile, setProfile] = useState<UserProfile>({
    name: initialProfile?.name || "",
    email: initialProfile?.email || "",
    weight: initialProfile?.weight || 70,
    activityLevel: initialProfile?.activityLevel || "moderate",
    climate: initialProfile?.climate || "moderate",
    customGoal: initialProfile?.customGoal,
  })

  const [useCustomGoal, setUseCustomGoal] = useState(!!initialProfile?.customGoal)

  // Calculate recommended daily goal based on profile
  const calculateRecommendedGoal = () => {
    let baseGoal = profile.weight * 35 // 35ml per kg body weight

    // Adjust for activity level
    switch (profile.activityLevel) {
      case "high":
        baseGoal *= 1.3
        break
      case "moderate":
        baseGoal *= 1.15
        break
      case "low":
        baseGoal *= 1.0
        break
    }

    // Adjust for climate
    switch (profile.climate) {
      case "hot":
        baseGoal *= 1.2
        break
      case "moderate":
        baseGoal *= 1.0
        break
      case "cool":
        baseGoal *= 0.95
        break
    }

    return Math.round(baseGoal)
  }

  const recommendedGoal = calculateRecommendedGoal()
  const finalGoal = useCustomGoal ? profile.customGoal || recommendedGoal : recommendedGoal

  const handleSubmit = () => {
    onComplete({
      ...profile,
      customGoal: useCustomGoal ? profile.customGoal : undefined,
    })
  }

  const isValid = profile.name.trim() && profile.email.trim() && profile.weight > 0

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Set Up Your Profile
          </CardTitle>
          <p className="text-muted-foreground">Help us calculate your personalized daily water goal</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
          </div>

          {/* Weight */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Weight className="h-4 w-4" />
              Weight: {profile.weight} kg
            </Label>
            <Slider
              value={[profile.weight]}
              onValueChange={([value]) => setProfile({ ...profile, weight: value })}
              min={30}
              max={150}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>30 kg</span>
              <span>150 kg</span>
            </div>
          </div>

          {/* Activity Level */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity Level
            </Label>
            <Select
              value={profile.activityLevel}
              onValueChange={(value: "low" | "moderate" | "high") => setProfile({ ...profile, activityLevel: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex flex-col items-start">
                    <span>Low Activity</span>
                    <span className="text-xs text-muted-foreground">Sedentary lifestyle, minimal exercise</span>
                  </div>
                </SelectItem>
                <SelectItem value="moderate">
                  <div className="flex flex-col items-start">
                    <span>Moderate Activity</span>
                    <span className="text-xs text-muted-foreground">Regular exercise 3-4 times per week</span>
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex flex-col items-start">
                    <span>High Activity</span>
                    <span className="text-xs text-muted-foreground">Daily exercise, athletic lifestyle</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Climate */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Climate
            </Label>
            <Select
              value={profile.climate}
              onValueChange={(value: "cool" | "moderate" | "hot") => setProfile({ ...profile, climate: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cool">
                  <div className="flex flex-col items-start">
                    <span>Cool Climate</span>
                    <span className="text-xs text-muted-foreground">Cold weather, indoor heating</span>
                  </div>
                </SelectItem>
                <SelectItem value="moderate">
                  <div className="flex flex-col items-start">
                    <span>Moderate Climate</span>
                    <span className="text-xs text-muted-foreground">Temperate weather conditions</span>
                  </div>
                </SelectItem>
                <SelectItem value="hot">
                  <div className="flex flex-col items-start">
                    <span>Hot Climate</span>
                    <span className="text-xs text-muted-foreground">Hot weather, high humidity</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Goal Calculation */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-4 w-4 text-primary" />
              <span className="font-medium">Recommended Daily Goal</span>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">{recommendedGoal} ml</div>
              <div className="text-sm text-muted-foreground">
                Based on your weight ({profile.weight}kg), {profile.activityLevel} activity, and {profile.climate}{" "}
                climate
              </div>
            </div>
          </div>

          {/* Custom Goal Option */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <Label htmlFor="custom-goal" className="flex items-center gap-2">
                  Set Custom Goal
                </Label>
              </div>
              <Switch id="custom-goal" checked={useCustomGoal} onCheckedChange={setUseCustomGoal} />
            </div>
            {useCustomGoal && (
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Enter custom goal in ml"
                  value={profile.customGoal || ""}
                  onChange={(e) => setProfile({ ...profile, customGoal: Number.parseInt(e.target.value) || undefined })}
                />
              </div>
            )}
          </div>

          {/* Final Goal Display */}
          <div className="p-3 bg-accent/5 rounded-lg border border-accent/20">
            <div className="flex items-center justify-between">
              <span className="font-medium">Your Daily Goal:</span>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {finalGoal} ml
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onSkip} className="flex-1 bg-transparent">
              Skip for Now
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid} className="flex-1">
              Complete Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
