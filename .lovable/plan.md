
# Fix Avatar Upload - Use Direct Fetch Instead of SDK

## What's Wrong

Your backend is fully connected and working! The issue is specifically with how the Supabase SDK handles storage uploads:

- The `supabase.storage.upload()` method hangs before making any network request
- This happens because the SDK waits for internal auth synchronization that sometimes doesn't complete
- Result: 30-second timeout, then "Saving..." gets stuck

## The Fix

Replace the SDK's storage upload with a direct HTTP request using `fetch`. This:
- Explicitly gets the auth session first
- Sends the file directly to the storage API with the auth token
- Bypasses the SDK's problematic internal auth handling

## Technical Changes

### File: `src/hooks/useProfile.ts`

Replace the `uploadAvatar` function:

```text
Current (broken):
  supabase.storage.from('avatars').upload(filePath, file, { upsert: true })

New (working):
  1. Get session with supabase.auth.getSession()
  2. Validate we have an access token
  3. Use fetch() to POST directly to storage endpoint
  4. Include Authorization header with Bearer token
```

The new upload flow:
```text
┌─────────────────────────────────────────────────────────┐
│ 1. Get Auth Session                                     │
│    supabase.auth.getSession() → access_token            │
├─────────────────────────────────────────────────────────┤
│ 2. Validate Session Exists                              │
│    If no token → return error immediately               │
├─────────────────────────────────────────────────────────┤
│ 3. Direct Upload via Fetch                              │
│    POST to: {supabase_url}/storage/v1/object/avatars/   │
│    Headers: Authorization: Bearer {token}               │
│             x-upsert: true                              │
│    Body: file                                           │
├─────────────────────────────────────────────────────────┤
│ 4. Get Public URL & Update Profile                      │
│    supabase.storage.getPublicUrl() (this still works)   │
│    updateProfile({ avatar_url: publicUrl })             │
└─────────────────────────────────────────────────────────┘
```

## Files to Change

1. **src/hooks/useProfile.ts** - Replace SDK upload with direct fetch

## Why This Will Work

- Direct `fetch` doesn't depend on SDK's internal auth state
- We explicitly verify the session exists before uploading
- If no session, user gets an immediate error instead of hanging
- The request either succeeds or fails quickly (no 30-second wait)
