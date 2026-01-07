"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, Play, Pause, Volume2, Trash2, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SoundUploadProps {
  onSoundChange: (soundUrl: string | null) => void
  currentSound: string | null
}

export function SoundUpload({ onSoundChange, currentSound }: SoundUploadProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const { toast } = useToast()

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an audio file (MP3, WAV, OGG, etc.)",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 100KB)
      if (file.size > 100 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an audio file smaller than 100KB",
          variant: "destructive",
        })
        return
      }

      // Read file as DataURL and pass it back
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Ensure not too large for localStorage (approx check)
        const approxSize = (result.length * 3) / 4
        if (approxSize > 100 * 1024) {
          toast({ title: "File too large for storage", description: "Uploaded audio exceeds 100KB when encoded.", variant: "destructive" })
          return
        }
        setUploadedFileName(file.name)
        onSoundChange(result)
        toast({ title: "Sound uploaded successfully", description: `${file.name} is now your notification sound` })
      }
      reader.onerror = () => {
        toast({ title: "Error", description: "Failed to read file", variant: "destructive" })
      }
      reader.readAsDataURL(file)
    },
    [onSoundChange, toast],
  )

  const playPreview = useCallback(() => {
    if (!currentSound) return

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setIsPlaying(false)
      } else {
        audioRef.current.src = currentSound
        audioRef.current.play().catch(() => {
          setIsPlaying(false)
          toast({ title: "Play failed", description: "Unable to play selected audio", variant: "destructive" })
        })
        setIsPlaying(true)
      }
    }
  }, [currentSound, isPlaying])

  const resetToDefault = useCallback(() => {
    if (currentSound && currentSound.startsWith("blob:")) {
      URL.revokeObjectURL(currentSound)
    }
    setUploadedFileName(null)
    onSoundChange(null)
    setIsPlaying(false)

    toast({
      title: "Reset to default",
      description: "Using default notification sound",
    })
  }, [currentSound, onSoundChange, toast])

  const removeSound = useCallback(() => {
    if (currentSound && currentSound.startsWith("blob:")) {
      URL.revokeObjectURL(currentSound)
    }
    setUploadedFileName(null)
    onSoundChange(null)
    setIsPlaying(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [currentSound, onSoundChange])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Notification Sound
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sound-upload">Upload Custom Sound</Label>
          <div className="flex gap-2">
            <Input
              id="sound-upload"
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Supported formats: MP3, WAV, OGG, M4A (max 100KB)</p>
        </div>

        {currentSound && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{uploadedFileName || "Custom Sound"}</span>
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={playPreview} className="h-8 w-8 p-0">
                  {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeSound}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive dark:text-destructive-foreground dark:hover:text-destructive-foreground"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {!currentSound && (
          <div className="text-center p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <Volume2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Using default notification sound</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              if (currentSound) {
                try {
                  // Let parent persist via onSoundChange
                  onSoundChange(currentSound)
                  // also persist here for immediate effect (parent hook will sync)
                  try { localStorage.setItem("water-reminder-custom-sound", currentSound) } catch {}
                  toast({ title: "Saved", description: "Notification sound saved" })
                } catch (e) {
                  console.warn("Failed to save sound:", e)
                  toast({ title: "Error", description: "Could not save sound", variant: "destructive" })
                }
              } else {
                toast({ title: "No sound", description: "Please upload a sound first", variant: "destructive" })
              }
            }}
            className="flex-1"
          >
            Save
          </Button>
          <Button variant="outline" onClick={resetToDefault} className="w-36 bg-transparent" disabled={!currentSound}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          onError={() => {
            setIsPlaying(false)
            toast({
              title: "Error playing sound",
              description: "There was an issue playing the audio file",
              variant: "destructive",
            })
          }}
        />
      </CardContent>
    </Card>
  )
}
