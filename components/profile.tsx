"use client"

import React from "react"
import { UserSettings } from "@/components/user-settings"

interface ProfileProps {
  profile: any
  onSave: (p: any) => void
  onClose: () => void
}

export default function Profile({ profile, onSave, onClose }: ProfileProps) {
  if (!profile) return null
  return <UserSettings profile={profile} onSave={onSave} onClose={onClose} />
}
