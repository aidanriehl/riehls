

# One-Tap Social Sign-In with Auto-Profile

## What We're Building
A frictionless sign-in experience where users tap one button (Google or Apple), and their profile is automatically created using their OAuth account info. No forms, no passwords, no manual onboarding steps.

## User Experience

**Before (current):**
1. Enter email
2. Enter password
3. Upload profile photo
4. Enter name
5. Enter bio
6. Click Complete

**After (new):**
1. Tap "Continue with Google" or "Continue with Apple"
2. Done - straight to the feed

## Changes

### 1. Configure OAuth Providers
- Enable Google and Apple sign-in via Lovable Cloud's managed OAuth (no API keys needed - it's automatic)

### 2. Redesign Auth Page
**New layout:**
- Logo: "riehls"
- Tagline: "finally, a curated feed"
- "Continue with Google" button
- "Continue with Apple" button

Remove all email/password fields and the login/signup toggle.

### 3. Auto-Create Profile from OAuth Data
When a user signs in via Google/Apple:
- Extract their name from `user.user_metadata.full_name` or `user.user_metadata.name`
- Extract their profile picture from `user.user_metadata.avatar_url` or `user.user_metadata.picture`
- Auto-generate a username from their name
- Set `onboarding_complete: true` immediately
- Redirect straight to the home feed

### 4. Update Auth Hook
Add `signInWithGoogle()` and `signInWithApple()` methods using Lovable Cloud's OAuth integration. Add logic to detect first-time users and auto-populate their profile.

### 5. Keep Onboarding as Fallback
The onboarding flow will remain in the codebase but users won't be redirected there since `onboarding_complete` will be set to `true` on first sign-in. This serves as a fallback if OAuth metadata is missing (e.g., Apple privacy settings hide the name).

---

## Technical Details

### OAuth User Metadata Structure
Google provides:
```
user.user_metadata = {
  name: "John Doe",
  full_name: "John Doe",
  picture: "https://lh3.googleusercontent.com/...",
  avatar_url: "https://lh3.googleusercontent.com/..."
}
```

Apple provides:
```
user.user_metadata = {
  full_name: { firstName: "John", lastName: "Doe" },
  picture: "..." // May be null if user hides it
}
```

### Files to Modify

1. **Configure OAuth** - Use the Lovable Cloud social auth configuration tool

2. **`src/pages/Auth.tsx`**
   - Remove all form state (email, password, isLogin)
   - Import and use the Lovable OAuth module
   - Replace form with two styled buttons (Google logo, Apple logo)
   - Update header text to "finally, a curated feed"

3. **`src/hooks/useAuth.tsx`**
   - Add profile auto-creation logic in `onAuthStateChange`
   - When a new user signs in via OAuth, check if their profile needs initialization
   - Extract name/avatar from `user.user_metadata` and update the profile with `onboarding_complete: true`

4. **`src/integrations/lovable/`** (auto-generated)
   - The OAuth configuration tool will create this module automatically

### Edge Case: Apple Privacy
If a user signs in with Apple and hides their info:
- Name may be missing → They'll still go to the feed but with no display name
- Photo may be missing → Default avatar placeholder
- They can always update their profile later via settings (which already exists)

