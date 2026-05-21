// main page
"use client"

import React, { useEffect, useState } from "react"
import { Droplets, Trophy, Target as TargetIcon, Settings, BarChart3, User, LogIn, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Tracker from "@/components/tracker"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { AchievementsGallery } from "@/components/achievements-gallery"
import Profile from "@/components/profile"
import Reminder from "@/components/reminder"
import { AuthModal } from "@/components/auth-modal"
import { AchievementNotification } from "@/components/achievement-notification"
import { ReminderNotification } from "@/components/reminder-notification"
import { useWaterHistory } from "@/hooks/use-water-history"
import { useAchievements } from "@/hooks/use-achievements"
import { useAppAuth } from "@/hooks/use-auth"
import { useReminderTimer } from "@/hooks/use-reminder-timer"
import { useNotifications } from "@/hooks/use-notifications"
import { useReminder } from "@/hooks/use-reminder"
import { calculateDailyGoal } from "@/lib/goal-calculator"

interface UserProfile {
	name: string
	email: string
	weight: number
	activityLevel: "low" | "moderate" | "high"
	climate: "cool" | "moderate" | "hot"
	customGoal?: number
}

export default function Page() {
	const { user, logout, isAuthenticated } = useAppAuth()
	const [showAuthModal, setShowAuthModal] = useState(false)
	const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

	const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
	const [showProfileSetup, setShowProfileSetup] = useState(false)

	const [currentView, setCurrentView] = useState<'tracker'|'analytics'|'achievements'|'profile'|'reminder'>('tracker')
	const [showReminder, setShowReminder] = useState(false)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	const { addWaterIntake, undoLastIntake, todayWaterIntake, history } = useWaterHistory()
	const { achievements, userStats, newlyUnlocked, dismissNewAchievements, getProgressPercentage, updateProgress } = useAchievements()

	const { requestPermission } = useNotifications()

	// simple reminder timer (default off)
	const [reminderEnabled, setReminderEnabled] = useState(false)
	const [reminderInterval, setReminderInterval] = useState(60)
	// keep timer in sync with state
	const reminderTimer = useReminderTimer({ interval: reminderInterval, onReminder: () => setShowReminder(true), enabled: reminderEnabled })

	// New persistent reminder hook
	const dailyGoal = userProfile ? calculateDailyGoal(userProfile) : 3000
	useReminder(reminderInterval, reminderEnabled, dailyGoal)

	// Register service worker
	useEffect(() => {
		if ('serviceWorker' in navigator) {
			window.addEventListener('load', () => {
				navigator.serviceWorker.register('/sw.js').then(
					(registration) => {
						console.log('ServiceWorker registration successful with scope: ', registration.scope)
					},
					(err) => {
						console.log('ServiceWorker registration failed: ', err)
					}
				)
			})
		}
	}, [])

	// When interval or enabled changes, reset timer so change applies immediately
	useEffect(() => {
		if (reminderEnabled) {
			try { reminderTimer.resetTimer() } catch (e) {}
		}
	}, [reminderInterval, reminderEnabled, reminderTimer])

	useEffect(() => {
		requestPermission()
	}, [requestPermission])

	// load profile from localStorage when authenticated
	useEffect(() => {
		if (!isAuthenticated || !user?.id) return
		try {
			const raw = localStorage.getItem(`userProfile_${user.id}`)
			if (raw) setUserProfile(JSON.parse(raw))
			else setShowProfileSetup(true)
		} catch (e) {
			// ignore
		}
	}, [isAuthenticated, user?.id])

	useEffect(() => {
		if (userProfile && user?.id) {
			try { localStorage.setItem(`userProfile_${user.id}`, JSON.stringify(userProfile)) } catch (e) {}
		}
	}, [userProfile, user?.id])

	const addWater = (amount: number) => {
		try {
			// record local recent activity for immediate UX
			const entry = { id: `${Date.now()}`, amount, timestamp: Date.now(), date: new Date().toISOString().split('T')[0] }
			const raw = localStorage.getItem(`recentActivity_${user?.id}`)
			const arr = raw ? JSON.parse(raw) : []
			arr.unshift(entry)
			localStorage.setItem(`recentActivity_${user?.id}`, JSON.stringify(arr.slice(0, 10)))
		} catch (e) {}

		addWaterIntake(amount)
		updateProgress(amount, dailyGoal, 0) // streak will be recalculated in hook
		reminderTimer.resetTimer()
	}

	const handleLogout = () => {
		logout()
		setUserProfile(null)
	}

	if (!isAuthenticated) {
		return (
			<div className="min-h-screen flex items-center justify-center p-6 bg-background">
				<div className="max-w-md text-center space-y-6">
					<div className="flex flex-col items-center gap-2">
						<Droplets className="h-12 w-12 text-primary" />
						<h1 className="text-3xl font-bold">Stay Hydrated</h1>
						<p className="text-muted-foreground">Track your daily water intake and build healthy habits.</p>
					</div>
					<div className="grid grid-cols-1 gap-3">
						<Button size="lg" onClick={() => { setAuthMode('login'); setShowAuthModal(true) }}>
							<LogIn className="mr-2 h-4 w-4" /> Sign in
						</Button>
						<Button variant="outline" size="lg" onClick={() => { setAuthMode('signup'); setShowAuthModal(true) }}>
							<User className="mr-2 h-4 w-4" /> Create account
						</Button>
					</div>
				</div>
				<AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} defaultMode={authMode} />
			</div>
		)
	}

	if (showProfileSetup) {
		const UserProfileSetup = require('../components/user-profile-setup').UserProfileSetup
		return <UserProfileSetup onComplete={(p: UserProfile) => { setUserProfile(p); setShowProfileSetup(false) }} onSkip={() => setShowProfileSetup(false)} initialProfile={userProfile || undefined} />
	}

	return (
		<div className="min-h-screen bg-background p-4 md:p-6">
			<div className="mx-auto max-w-4xl space-y-6">
				{/* Responsive Navbar */}
				<nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border rounded-xl p-3 shadow-sm">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 px-2">
							<div className="p-1.5 bg-primary/10 rounded-lg">
								<Droplets className="h-5 w-5 text-primary" />
							</div>
							<h2 className="text-lg font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
								Hydration
							</h2>
						</div>

						{/* Desktop Menu */}
						<div className="hidden md:flex items-center gap-1">
							<Button variant={currentView === 'tracker' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentView('tracker')} className="flex items-center gap-2"><TargetIcon className="h-4 w-4" /> Tracker</Button>
							<Button variant={currentView === 'achievements' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentView('achievements')} className="flex items-center gap-2"><Trophy className="h-4 w-4" /> Achievements</Button>
							<Button variant={currentView === 'analytics' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentView('analytics')} className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Analytics</Button>
							<div className="w-px h-6 bg-border mx-1" />
							<Button variant={currentView === 'profile' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentView('profile')} className="flex items-center gap-2"><User className="h-4 w-4" /> Profile</Button>
							<Button variant={currentView === 'reminder' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentView('reminder')} className="flex items-center gap-2"><Settings className="h-4 w-4" /> Reminders</Button>
							<Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"><LogOut className="h-4 w-4" /> Logout</Button>
						</div>

						{/* Mobile Menu Button */}
						<Button 
							variant="ghost" 
							size="icon" 
							className="md:hidden"
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						>
							{isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
						</Button>
					</div>

					{/* Mobile Menu Dropdown */}
					{isMobileMenuOpen && (
						<div className="md:hidden pt-3 pb-2 space-y-1 animate-in slide-in-from-top duration-200">
							<Button 
								variant={currentView === 'tracker' ? 'secondary' : 'ghost'} 
								className="w-full justify-start gap-3 h-11" 
								onClick={() => { setCurrentView('tracker'); setIsMobileMenuOpen(false) }}
							>
								<TargetIcon className="h-5 w-5" /> Tracker
							</Button>
							<Button 
								variant={currentView === 'achievements' ? 'secondary' : 'ghost'} 
								className="w-full justify-start gap-3 h-11" 
								onClick={() => { setCurrentView('achievements'); setIsMobileMenuOpen(false) }}
							>
								<Trophy className="h-5 w-5" /> Achievements
							</Button>
							<Button 
								variant={currentView === 'analytics' ? 'secondary' : 'ghost'} 
								className="w-full justify-start gap-3 h-11" 
								onClick={() => { setCurrentView('analytics'); setIsMobileMenuOpen(false) }}
							>
								<BarChart3 className="h-5 w-5" /> Analytics
							</Button>
							<div className="h-px bg-border my-2" />
							<Button 
								variant={currentView === 'profile' ? 'secondary' : 'ghost'} 
								className="w-full justify-start gap-3 h-11" 
								onClick={() => { setCurrentView('profile'); setIsMobileMenuOpen(false) }}
							>
								<User className="h-5 w-5" /> Profile
							</Button>
							<Button 
								variant={currentView === 'reminder' ? 'secondary' : 'ghost'} 
								className="w-full justify-start gap-3 h-11" 
								onClick={() => { setCurrentView('reminder'); setIsMobileMenuOpen(false) }}
							>
								<Settings className="h-5 w-5" /> Reminders
							</Button>
							<Button 
								variant="ghost" 
								className="w-full justify-start gap-3 h-11 text-destructive hover:bg-destructive/10" 
								onClick={handleLogout}
							>
								<LogOut className="h-5 w-5" /> Logout
							</Button>
						</div>
					)}
				</nav>

				{currentView === 'analytics' ? (
					<AnalyticsDashboard dailyGoal={dailyGoal} onClose={() => setCurrentView('tracker')} />
				) : currentView === 'achievements' ? (
					<AchievementsGallery achievements={achievements} userStats={userStats} getProgressPercentage={getProgressPercentage} onClose={() => setCurrentView('tracker')} />
				) : currentView === 'profile' ? (
					<Profile profile={userProfile} onSave={(p: UserProfile) => { setUserProfile(p); setCurrentView('tracker') }} onClose={() => setCurrentView('tracker')} />
				) : currentView === 'reminder' ? (
					<Reminder
						isEnabled={reminderEnabled}
						interval={reminderInterval}
						onToggle={(v: boolean) => setReminderEnabled(v)}
						onIntervalChange={(n: number) => setReminderInterval(n)}
						reminderTimer={reminderTimer}
					/>
				) : (
					<Tracker
						todayWaterIntake={todayWaterIntake}
						dailyGoal={dailyGoal}
						userProfile={userProfile}
						progressPercentage={dailyGoal > 0 ? Math.min((todayWaterIntake / dailyGoal) * 100, 100) : 0}
						addWater={addWater}
						undoLastIntake={undoLastIntake}
						cupsCompleted={Math.floor(todayWaterIntake / 250)}
						totalCups={Math.ceil((dailyGoal || 2000) / 250)}
						lastDrinkTime={new Date(history[0]?.timestamp || Date.now() - 3600 * 1000)}
						formatTimeAgo={(d: Date) => {
							const mins = Math.floor((Date.now() - d.getTime()) / 60000)
							if (mins < 60) return `${mins}m ago`
							const hrs = Math.floor(mins / 60)
							return `${hrs}h ago`
						}}
						streak={0}
					/>
				)}

				<ReminderNotification isVisible={showReminder} onDismiss={() => setShowReminder(false)} onSnooze={(m: number) => reminderTimer.snooze(m)} onDrinkWater={() => { addWater(250); setShowReminder(false) }} />
				<AchievementNotification achievements={newlyUnlocked} onDismiss={dismissNewAchievements} />
			</div>
		</div>
	)
}

