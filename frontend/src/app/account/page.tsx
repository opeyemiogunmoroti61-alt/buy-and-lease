'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { djangoFetch } from '@/utils/django/client'
import { Camera, Mail, User, Shield, Edit2, Save, X, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface Profile {
  email: string
  username: string
  full_name?: string
  role: string
  created_at: string
  avatar?: string
}

export default function AccountPage() {
  const { user, isLoading, refreshUser } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [form, setForm] = useState({
    username: '',
    full_name: '',
  })

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Fetch profile
  useEffect(() => {
    if (!user) return
    const fetchProfile = async () => {
      try {
        const res = await djangoFetch('/api/auth/me/')
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
          setForm({
            username: data.username || '',
            full_name: data.full_name || '',
          })
        }
      } catch {
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [user])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB')
      return
    }
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await djangoFetch('/api/auth/profile/update/', {
        method: 'PATCH',
        body: JSON.stringify(form),
      })

      if (res.ok) {
        const data = await res.json()
        setProfile(prev => prev ? { ...prev, ...data } : data)
        // Update localStorage user
        const stored = localStorage.getItem('user')
        if (stored) {
          const parsed = JSON.parse(stored)
          localStorage.setItem('user', JSON.stringify({ ...parsed, ...form }))
        }
        refreshUser()
        setEditMode(false)
        toast.success('Profile updated!')
      } else {
        const err = await res.json()
        toast.error(err.detail || 'Failed to update profile')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = () => {
    localStorage.clear()
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    router.push('/login')
  }

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      landlord: 'Landlord',
      tenant: 'Tenant',
      agent: 'Agent',
      admin: 'Admin',
    }
    return map[role] || role
  }

  const roleBadgeColor = (role: string) => {
    const map: Record<string, string> = {
      landlord: 'bg-indigo-100 text-indigo-700',
      tenant: 'bg-emerald-100 text-emerald-700',
      agent: 'bg-violet-100 text-violet-700',
      admin: 'bg-red-100 text-red-700',
    }
    return map[role] || 'bg-slate-100 text-slate-700'
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!profile) return null

  const avatarUrl = avatarPreview || '/default-avatar.png'
  const joinedDate = new Date(profile.created_at).toLocaleDateString('en-NG', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Cover */}
          <div className="h-28 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600" />

          {/* Avatar + name */}
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-slate-200">
                  <Image
                    src={avatarUrl}
                    alt={profile.username}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                </div>
                {editMode && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-1.5 shadow hover:bg-indigo-700 transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-14">
                {!editMode ? (
                  <>
                    <Button
                      onClick={() => setEditMode(true)}
                      variant="outline"
                      className="flex items-center gap-2 text-sm">
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </Button>
                    <Button
                      onClick={handleSignOut}
                      variant="outline"
                      className="flex items-center gap-2 text-sm text-red-600 border-red-200 hover:bg-red-50">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-700">
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      onClick={() => { setEditMode(false); setAvatarPreview(null) }}
                      variant="outline"
                      className="flex items-center gap-2 text-sm">
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Name and role */}
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  {profile.full_name || profile.username}
                </h1>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${roleBadgeColor(profile.role)}`}>
                  {roleLabel(profile.role)}
                </span>
              </div>
              <p className="text-slate-400 text-sm">@{profile.username}</p>
              <p className="text-slate-400 text-xs">Member since {joinedDate}</p>
            </div>
          </div>
        </div>

        {/* Profile details card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
          <h2 className="font-bold text-slate-900 text-lg">Profile Information</h2>

          {/* Full name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Full Name
            </label>
            {editMode ? (
              <Input
                value={form.full_name}
                onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Enter your full name"
                className="max-w-sm"
              />
            ) : (
              <p className="text-slate-700 font-medium">
                {profile.full_name || <span className="text-slate-400 italic">Not set</span>}
              </p>
            )}
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Username
            </label>
            {editMode ? (
              <Input
                value={form.username}
                onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Enter username"
                className="max-w-sm"
              />
            ) : (
              <p className="text-slate-700 font-medium">@{profile.username}</p>
            )}
          </div>

          {/* Email — read only */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Email Address
            </label>
            <div className="flex items-center gap-2">
              <p className="text-slate-700 font-medium">{profile.email}</p>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Read only</span>
            </div>
          </div>

          {/* Role — read only */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" /> Account Role
            </label>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${roleBadgeColor(profile.role)}`}>
                {roleLabel(profile.role)}
              </span>
              <span className="text-xs text-slate-400">Cannot be changed</span>
            </div>
          </div>
        </div>

        {/* Dashboard shortcut */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 text-lg mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            {profile.role === 'landlord' ? (
              <>
                <a href="/dashboard/landlord"
                  className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                  <span className="text-2xl">🏠</span>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">My Listings</p>
                    <p className="text-xs text-slate-500">Manage properties</p>
                  </div>
                </a>
                <a href="/dashboard/landlord"
                  className="flex items-center gap-3 p-4 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors">
                  <span className="text-2xl">➕</span>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Add Property</p>
                    <p className="text-xs text-slate-500">Post a new listing</p>
                  </div>
                </a>
              </>
            ) : profile.role === 'agent' ? (
              <>
                <a href="/dashboard/agent"
                  className="flex items-center gap-3 p-4 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors">
                  <span className="text-2xl">🏢</span>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">My Listings</p>
                    <p className="text-xs text-slate-500">Manage properties</p>
                  </div>
                </a>
                <a href="/dashboard/agent"
                  className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                  <span className="text-2xl">➕</span>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">List a Property</p>
                    <p className="text-xs text-slate-500">Post on behalf of client</p>
                  </div>
                </a>
              </>
            ) : (
              <>
                <a href="/properties"
                  className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
                  <span className="text-2xl">🔍</span>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Browse Listings</p>
                    <p className="text-xs text-slate-500">Find properties</p>
                  </div>
                </a>
                <a href="/dashboard/tenant"
                  className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                  <span className="text-2xl">❤️</span>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Saved Listings</p>
                    <p className="text-xs text-slate-500">Your favourites</p>
                  </div>
                </a>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}