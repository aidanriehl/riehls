
# Implementation Plan: Backend Setup, Video Hosting, Admin Upload, and User Onboarding

## Overview

This plan covers setting up the complete backend infrastructure for your app, including:
- Database and authentication (Supabase)
- Video hosting (Cloudinary - simplest for MVP)
- Admin video upload interface
- User signup and onboarding flow

---

## Part 1: Backend Infrastructure Setup

### Supabase Integration (Lovable Cloud)
I'll set up Lovable Cloud which spins up a managed Supabase backend automatically - no external accounts needed.

**What gets created:**
- User authentication (signup/login)
- Database tables for profiles, videos, comments, notifications
- Storage bucket for profile photos
- Row-level security policies for data protection

### Video Hosting: Cloudinary (Recommended for MVP)

**Why Cloudinary:**
- Simplest setup - just upload and get a URL
- Free tier: 25GB storage + 25GB bandwidth/month
- Automatic video optimization and delivery
- No complex encoding setup needed

**What you'll need to do:**
1. Create a free Cloudinary account at cloudinary.com
2. Provide me with your Cloud Name, API Key, and API Secret when prompted

---

## Part 2: Database Schema

### Tables to Create

```text
profiles
├── id (uuid, references auth.users)
├── username (text, unique)
├── display_name (text)
├── avatar_url (text)
├── bio (text)
├── onboarding_complete (boolean)
├── created_at (timestamp)
└── updated_at (timestamp)

user_roles
├── id (uuid)
├── user_id (uuid, references auth.users)
└── role (enum: admin, user)

videos
├── id (uuid)
├── video_url (text) - Cloudinary URL
├── thumbnail_url (text)
├── caption (text)
├── creator_id (uuid, references profiles)
├── like_count (integer)
├── comment_count (integer)
├── created_at (timestamp)
└── is_published (boolean)

likes
├── id (uuid)
├── user_id (uuid, references profiles)
├── video_id (uuid, references videos)
└── created_at (timestamp)

comments
├── id (uuid)
├── video_id (uuid, references videos)
├── user_id (uuid, references profiles)
├── text (text)
├── like_count (integer)
├── created_at (timestamp)
└── parent_id (uuid, nullable - for replies)

notifications
├── id (uuid)
├── recipient_id (uuid, references profiles)
├── actor_id (uuid, references profiles)
├── type (enum: like, comment)
├── video_id (uuid, references videos)
├── message (text)
├── is_read (boolean)
└── created_at (timestamp)
```

---

## Part 3: Authentication and Onboarding Flow

### User Journey

```text
1. Landing → Signup/Login Screen
   ↓
2. New users → Onboarding Flow
   ├── Step 1: Upload profile photo
   ├── Step 2: Enter display name
   └── Step 3: Write short bio
   ↓
3. Complete → Main Feed
```

### Pages and Components to Create

**New Pages:**
- `/auth` - Login/Signup page with email authentication
- `/onboarding` - Multi-step onboarding wizard

**Onboarding Flow Design:**
- Full-screen, mobile-first design
- Progress indicator (3 steps)
- Step 1: Large circular photo upload area with camera icon
- Step 2: Clean input for display name
- Step 3: Textarea for bio with character count
- "Continue" button at bottom of each step
- Skip option for bio (optional field)

---

## Part 4: Admin Video Upload

### Admin Detection
- Your account gets the `admin` role in the `user_roles` table
- Only admin users see the upload interface

### Upload Interface Location
- Hidden route at `/admin/upload` (only accessible if admin)
- OR floating "+" button on your feed view (only visible to you)

### Upload Flow

```text
Admin taps upload → Select video file
   ↓
Video uploads to Cloudinary via edge function
   ↓
Add caption in text field
   ↓
Preview thumbnail (auto-generated)
   ↓
Publish → Video appears in feed
```

### Edge Function for Cloudinary Upload
A server-side function handles the actual Cloudinary upload to keep your API credentials secure.

---

## Part 5: Profile Integration

### Where Profile Data Appears

**Comments:**
- User's avatar from `profiles.avatar_url`
- Username from `profiles.username`

**Activity/Notifications:**
- Actor's avatar and username from profiles table

**Feed Captions:**
- Currently hardcoded to "aidan" - stays as creator attribution
- Comments show the commenter's real profile

---

## Technical Details

### File Structure Changes

```text
src/
├── lib/
│   └── supabase.ts              (Supabase client)
├── hooks/
│   ├── useAuth.ts               (Authentication hook)
│   ├── useProfile.ts            (Profile management)
│   └── useVideos.ts             (Updated for real data)
├── pages/
│   ├── Auth.tsx                 (Login/Signup)
│   ├── Onboarding.tsx           (Profile setup wizard)
│   └── AdminUpload.tsx          (Video upload - admin only)
├── components/
│   ├── ProtectedRoute.tsx       (Auth guard)
│   ├── OnboardingStep1.tsx      (Photo upload)
│   ├── OnboardingStep2.tsx      (Display name)
│   ├── OnboardingStep3.tsx      (Bio)
│   └── VideoUploadForm.tsx      (Admin upload form)

supabase/
├── config.toml
├── migrations/
│   └── 001_initial_schema.sql
└── functions/
    └── upload-video/
        └── index.ts             (Cloudinary upload handler)
```

### Security Measures
- Row-level security on all tables
- Admin role check via secure database function
- Video upload only through authenticated edge function
- Profile photos stored in Supabase Storage with proper policies

---

## Implementation Order

1. **Enable Lovable Cloud** - Set up backend infrastructure
2. **Create database schema** - Tables, RLS policies, triggers
3. **Add authentication** - Login/signup pages with protected routes
4. **Build onboarding flow** - 3-step profile setup wizard
5. **Set up Cloudinary** - Request API credentials, create edge function
6. **Build admin upload** - Video upload interface for your account
7. **Connect everything** - Replace mock data with real database queries

---

## What You'll Need to Provide

1. **Cloudinary account** - Create at cloudinary.com (free tier is fine)
2. **Cloudinary credentials** - Cloud Name, API Key, API Secret (I'll prompt you when ready)
3. **Your email** - To set your account as admin after first signup

---

## Questions Before Starting

None required - I have everything needed to begin. After you approve this plan, I'll start by enabling Lovable Cloud and creating the database schema.
