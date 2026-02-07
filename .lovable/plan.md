
# Fix Profile Synchronization Across All Views

## The Problem

When you edit your profile (name, bio, avatar), three different places in the app show different data because they each fetch independently:

1. **Your profile page** (`/profile` - bottom nav) - Uses `useProfile()` hook
2. **Creator profile** (`/creator` - click "aidan" in feed) - Has its own `useCreatorProfile()` hook  
3. **Video feed** - Creator info comes from `useVideos()` with a database join

After editing, only place #1 updates because the Settings Sheet only updates the `useProfile()` state. The other two pages show stale data until you refresh.

---

## The Solution

Make the Settings Sheet properly save to the database, then ensure all places pull fresh data.

### Changes

**1. ProfileSettingsSheet.tsx**
- Call `updateProfile()` from `useProfile()` to actually persist name/bio changes to the database (avatar already saves correctly)
- Currently `onSave()` is called but Profile.tsx's `handleProfileSave` is empty

**2. Profile.tsx**
- After saving, call `profile.refetch()` to refresh the profile data
- Alternatively: have the settings sheet trigger a refetch via callback

**3. CreatorProfile.tsx** 
- Instead of using a local `useCreatorProfile()` hook, reuse `useProfile()` since you (the admin) are the creator
- This way both pages share the same data source

**4. useVideos.ts (for feed)**
- After profile changes, the video feed still shows old creator data
- Option A: Invalidate/refetch videos on profile update (cleanest)
- Option B: Subscribe to profile changes with realtime (more complex)
- Recommended: React Query's `queryClient.invalidateQueries()` or a simple refetch callback

---

## Technical Implementation

```text
Current Flow (broken):
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│  /profile page     │    │  /creator page     │    │  Feed/VideoCaption │
│  useProfile()      │    │  useCreatorProfile │    │  useVideos()       │
│  (fetches profile) │    │  (fetches profile) │    │  (fetches videos+  │
└────────────────────┘    └────────────────────┘    │   creator join)    │
         ▲                         ▲               └────────────────────┘
         │                         │                         ▲
         │ updates                 │ stale                   │ stale
         │                         │                         │
┌────────────────────┐                                      │
│ ProfileSettingsSheet                                      │
│ updateProfile()    │──────────────────────────────────────┘
│ (saves to DB)      │
└────────────────────┘

Fixed Flow:
┌────────────────────────────────────────────────────────────┐
│                    useProfile() hook                        │
│  - Shared profile state for all admin profile displays     │
│  - refetch() triggers refresh everywhere                   │
└────────────────────────────────────────────────────────────┘
         ▲                         ▲                ▲
         │                         │                │
┌────────────┐           ┌──────────────┐    ┌──────────────┐
│  /profile  │           │  /creator    │    │ VideoCaption │
│    page    │           │    page      │    │ (pass from   │
└────────────┘           └──────────────┘    │  useProfile) │
                                             └──────────────┘
```

### File Changes

**src/components/ProfileSettingsSheet.tsx:**
- Accept `updateProfile` function as prop (or import useProfile directly)
- Call `updateProfile({ display_name, bio })` before showing success toast

**src/pages/Profile.tsx:**
- Pass `updateProfile` and `refetch` to ProfileSettingsSheet
- Update `handleProfileSave` to actually persist data

**src/pages/CreatorProfile.tsx:**
- For admin: use `useProfile()` instead of local hook
- For non-admin visitors: keep fetching the admin's profile from DB

**src/hooks/useVideos.ts:**
- Add a `refetch` function that can be called after profile updates
- Or use React Query's built-in invalidation

---

## Summary

| Location | Current Data Source | After Fix |
|----------|-------------------|-----------|
| /profile | useProfile() | useProfile() (unchanged) |
| /creator | Local useCreatorProfile() | useProfile() for admin, or refetch on mount |
| Feed caption | useVideos() join | Refetch after profile changes |

This ensures that when you edit your profile, all three views update immediately to show the same data.
