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
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"
import { SoundUpload } from "@/components/sound-upload"
import { useCustomSound } from "@/hooks/use-custom-sound"
import { useWaterHistory } from "@/hooks/use-water-history"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  User,
  Weight,
  Activity,
  Thermometer,
  Target,
  Calculator,
  Moon,
  Sun,
  Monitor,
  Save,
  RotateCcw,
  Palette,
  Settings,
  UserCheck,
  Target as TargetIcon,
} from "lucide-react"

interface UserProfile {
  name: string
  email: string
  weight: number
  activityLevel: "low" | "moderate" | "high"
  climate: "cool" | "moderate" | "hot"
  customGoal?: number
}

interface UserSettingsProps {
  profile: UserProfile
  onSave: (profile: UserProfile) => void
  onClose: () => void
}

export function UserSettings({ profile: initialProfile, onSave, onClose }: UserSettingsProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile)
  const [useCustomGoal, setUseCustomGoal] = useState(!!initialProfile.customGoal)
  const [editMode, setEditMode] = useState<"profile" | "physical" | "goal" | null>(null)
  const { theme, setTheme } = useTheme()
  const { customSoundUrl, updateCustomSound } = useCustomSound()
  // Prepare convex mutation hooks once
  const deleteUserDataMutationRef = (api as any)?.users?.deleteUserData ?? null
  const deleteUserData = useMutation(deleteUserDataMutationRef as any)

  // Calculate recommended daily goal
  const calculateRecommendedGoal = () => {
    let baseGoal = profile.weight * 35

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

  const handleSave = () => {
    onSave({
      ...profile,
      customGoal: useCustomGoal ? profile.customGoal : undefined,
    })

    // Persist to Convex when available
    try {
      const currentUser = localStorage.getItem("currentUser")
      if (currentUser) {
        const parsed = JSON.parse(currentUser) as any
        if (parsed.convexId) {
          const updateUser = useMutation(api.users.updateUserSettings)
          updateUser({
            userId: parsed.convexId,
            dailyGoal: useCustomGoal ? profile.customGoal : undefined,
            weight: profile.weight,
            activityLevel: profile.activityLevel,
            climate: profile.climate,
            reminderInterval: undefined,
          })
        }
      }
    } catch (e) {
      console.warn("Failed to persist user settings to Convex:", e)
    }
  }

  const handleReset = () => {
    setProfile(initialProfile)
    setUseCustomGoal(!!initialProfile.customGoal)
  }

  const handleEdit = (section: "profile" | "physical" | "goal") => {
    setEditMode(section)
  }

  const handleSaveSection = (section: "profile" | "physical" | "goal") => {
    setEditMode(null)
    // Auto-save when section is saved
    handleSave()
  }

  const handleCancelEdit = () => {
    setEditMode(null)
    // Reset to initial values
    setProfile(initialProfile)
    setUseCustomGoal(!!initialProfile.customGoal)
  }

  const hasChanges =
    JSON.stringify(profile) !== JSON.stringify(initialProfile) || useCustomGoal !== !!initialProfile.customGoal

  const { resetAllData } = useWaterHistory()

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="physical" className="flex items-center gap-2">
            <Weight className="h-4 w-4" />
            Physical
          </TabsTrigger>
          <TabsTrigger value="goal" className="flex items-center gap-2">
            <TargetIcon className="h-4 w-4" />
            Daily Goal
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Profile Settings
              </CardTitle>
              {editMode === "profile" ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSaveSection("profile")}>
                    Save
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => handleEdit("profile")}>
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-name">Name</Label>
                  <Input
                    id="settings-name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    disabled={editMode !== "profile"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-email">Email</Label>
                  <Input
                    id="settings-email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled={editMode !== "profile"}
                  />
                </div>
              </div>

              {/* Sound Upload Section */}
              <Separator />
              <SoundUpload onSoundChange={updateCustomSound} currentSound={customSoundUrl} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Physical Profile Tab */}
        <TabsContent value="physical" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Weight className="h-5 w-5" />
                Physical Profile
              </CardTitle>
              {editMode === "physical" ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSaveSection("physical")}>
                    Save
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => handleEdit("physical")}>
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
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
                  disabled={editMode !== "physical"}
                />
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
                  disabled={editMode !== "physical"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Activity</SelectItem>
                    <SelectItem value="moderate">Moderate Activity</SelectItem>
                    <SelectItem value="high">High Activity</SelectItem>
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
                  disabled={editMode !== "physical"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cool">Cool Climate</SelectItem>
                    <SelectItem value="moderate">Moderate Climate</SelectItem>
                    <SelectItem value="hot">Hot Climate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Goal Tab */}
        <TabsContent value="goal" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Daily Goal
              </CardTitle>
              {editMode === "goal" ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSaveSection("goal")}>
                    Save
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => handleEdit("goal")}>
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recommended Goal */}
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  <span className="font-medium">Recommended Goal</span>
                </div>
                <div className="text-xl font-bold text-primary">{recommendedGoal} ml</div>
              </div>

              {/* Custom Goal Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-goal-toggle" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Use Custom Goal
                </Label>
                <Switch 
                  id="custom-goal-toggle" 
                  checked={useCustomGoal} 
                  onCheckedChange={setUseCustomGoal}
                  disabled={editMode !== "goal"}
                />
              </div>

              {/* Custom Goal Input */}
              {useCustomGoal && (
                <div className="space-y-2">
                  <Label>Custom Daily Goal (ml)</Label>
                  <Input
                    type="number"
                    value={profile.customGoal || ""}
                    onChange={(e) => setProfile({ ...profile, customGoal: Number.parseInt(e.target.value) || undefined })}
                    placeholder={recommendedGoal.toString()}
                    disabled={editMode !== "goal"}
                  />
                </div>
              )}

              {/* Final Goal Display */}
              <div className="p-3 bg-accent/5 rounded-lg border border-accent/20">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Active Daily Goal:</span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {finalGoal} ml
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                    className="flex items-center gap-2"
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                    className="flex items-center gap-2"
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    onClick={() => setTheme("system")}
                    className="flex items-center gap-2"
                  >
                    <Monitor className="h-4 w-4" />
                    System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-3">
  <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent dark:text-white dark:hover:text-white cursor-pointer">
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            const ok = confirm('This will clear all tracking data (water history, analytics, achievements) but will keep your profile. Continue?')
            if (ok) {
                try {
                  // Call server to delete user data if available (fire-and-forget)
                  const currentUser = localStorage.getItem('currentUser')
                  if (currentUser) {
                    const parsed = JSON.parse(currentUser) as any
                    if (parsed.convexId && deleteUserData) {
                      try {
                        deleteUserData({ userId: parsed.convexId })
                      } catch (e) {
                        console.warn('Failed to call server-side delete:', e)
                      }
                    }
                  }

                  // Client-side clear
                  resetAllData()
                  // also clear achievements and userStats explicitly
                  try { localStorage.removeItem('achievements') } catch {}
                  try { localStorage.removeItem('userStats') } catch {}

                  alert('All tracking data (including achievements) cleared. Your profile was preserved.')
                } catch (e) {
                  console.warn('Reset failed:', e)
                  alert('Reset failed. See console for details.')
                }
              }
          }}
          className={`flex items-center gap-2 bg-transparent ${theme === 'light' ? 'bg-primary hover:bg-primary/90 text-white dark:text-white dark:hover:text-white' : ''} cursor-pointer`}
        >
          <RotateCcw className="h-4 w-4" />
          Reset Over all
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges} className="flex-1 flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
