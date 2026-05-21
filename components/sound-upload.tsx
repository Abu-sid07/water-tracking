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
  const [pendingSound, setPendingSound] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const { toast } = useToast()

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const allowedTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/x-m4a", "audio/mp4"]
      const allowedExtensions = [".mp3", ".wav", ".ogg", ".m4a"]
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf("."))

      // Validate file type and extension
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        toast({
          title: "Unsupported file format",
          description: "This file is unsupported. Please upload a different file.",
          variant: "destructive",
        })
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }

      // Validate file size (max 500KB)
      if (file.size > 500 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 500KB. Your file is " + Math.round(file.size / 1024) + "KB.",
          variant: "destructive",
        })
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }

      // Validate duration (max 30 seconds)
      const audioUrl = URL.createObjectURL(file)
      const tempAudio = new Audio(audioUrl)
      
      tempAudio.addEventListener("loadedmetadata", () => {
        const duration = tempAudio.duration
        URL.revokeObjectURL(audioUrl)

        if (duration > 30) {
          toast({
            title: "File too long",
            description: `The audio duration is ${Math.round(duration)}s. Maximum allowed is 30s.`,
            variant: "destructive",
          })
          if (fileInputRef.current) fileInputRef.current.value = ""
          return
        }

        // Proceed to read file if duration is valid
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          // Ensure not too large for localStorage (approx check)
          const approxSize = (result.length * 3) / 4
          if (approxSize > 512 * 1024) {
            toast({ 
              title: "Storage limit exceeded", 
              description: "The encoded audio file is too large for browser storage.", 
              variant: "destructive" 
            })
            if (fileInputRef.current) fileInputRef.current.value = ""
            return
          }
          setUploadedFileName(file.name)
          setPendingSound(result)
          toast({ title: "File selected", description: `Click 'Upload' to set ${file.name} as your notification sound` })
        }
        reader.onerror = () => {
          toast({ title: "Error", description: "Failed to read file", variant: "destructive" })
        }
        reader.readAsDataURL(file)
      })

      tempAudio.addEventListener("error", () => {
        URL.revokeObjectURL(audioUrl)
        toast({
          title: "Invalid audio file",
          description: "Could not read audio metadata. Please try a different file.",
          variant: "destructive",
        })
        if (fileInputRef.current) fileInputRef.current.value = ""
      })
    },
    [toast],
  )

  const handleApplySound = useCallback(() => {
    if (pendingSound) {
      onSoundChange(pendingSound)
      setPendingSound(null)
      toast({ title: "Sound updated", description: "Your notification sound has been updated" })
    }
  }, [pendingSound, onSoundChange, toast])

  const playPreview = useCallback(() => {
    const soundToPlay = pendingSound || currentSound
    if (!soundToPlay) return

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setIsPlaying(false)
      } else {
        audioRef.current.src = soundToPlay
        audioRef.current.play().catch(() => {
          setIsPlaying(false)
          toast({ title: "Play failed", description: "Unable to play selected audio", variant: "destructive" })
        })
        setIsPlaying(true)
      }
    }
  }, [currentSound, pendingSound, isPlaying, toast])

  const resetToDefault = useCallback(() => {
    setUploadedFileName(null)
    setPendingSound(null)
    onSoundChange(null)
    setIsPlaying(false)

    toast({
      title: "Reset to default",
      description: "Using default notification sound",
    })
  }, [onSoundChange, toast])

  const removeSound = useCallback(() => {
    setUploadedFileName(null)
    setPendingSound(null)
    onSoundChange(null)
    setIsPlaying(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [onSoundChange])

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
          <Label htmlFor="sound-upload">Choose Custom Sound</Label>
          <div className="flex gap-2">
            <Input
              id="sound-upload"
              type="file"
              accept=".mp3,audio/mpeg,.wav,audio/wav,.ogg,audio/ogg,.m4a,audio/x-m4a,audio/mp4"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Supported formats: MP3, WAV, OGG, M4A (max 500KB, max 30s)</p>
        </div>

        {(currentSound || pendingSound) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{uploadedFileName || (pendingSound ? "New Sound" : "Current Sound")}</span>
                {pendingSound ? (
                  <Badge variant="outline" className="text-xs text-orange-500 border-orange-500">
                    Pending
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={playPreview} className="h-8 w-8 p-0">
                  {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeSound}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {!currentSound && !pendingSound && (
          <div className="text-center p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <Volume2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Using default notification sound</p>
          </div>
        )}

        <div className="flex gap-2">
          {pendingSound && (
            <Button onClick={handleApplySound} className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Upload & Set Sound
            </Button>
          )}
          <Button variant="outline" onClick={resetToDefault} className={pendingSound ? "w-1/3 bg-transparent" : "flex-1 bg-transparent"} disabled={!currentSound && !pendingSound}>
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
