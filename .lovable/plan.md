
# Fix Avatar Upload Freeze in Onboarding

## Problem Summary
When uploading a profile photo during onboarding, the app freezes on "Saving..." because the storage upload request can hang indefinitely. There's no timeout protection, so if the network is slow or the request fails silently, the user gets stuck.

## Root Cause
The `uploadAvatar` function in `useProfile.ts` makes a `fetch()` call to upload the image, but:
- No timeout is set on the fetch request
- If the request hangs, the Promise never resolves or rejects
- The UI stays in "Saving..." state forever

## Solution Overview
Add comprehensive timeout protection and improved error handling at both the hook level and the onboarding component level.

---

## Changes Required

### 1. Update `src/hooks/useProfile.ts` - Add Upload Timeout

Add a 15-second timeout wrapper around the storage upload fetch request using `AbortController`:

```text
Key changes:
- Create AbortController before fetch
- Set 15-second timeout to abort the request
- Clear timeout on success
- Handle AbortError specifically with user-friendly message
- Add detailed console logging at each step
```

The upload flow becomes:

```text
Start Upload
    |
    v
Get Session (with retry logic - existing)
    |
    v
Create AbortController + 15s timeout
    |
    v
Fetch to storage endpoint ──[timeout]──> AbortError → "Upload timed out"
    |
    v
Parse response
    |
    v
Get public URL
    |
    v
Update profile with avatar_url
    |
    v
Return success
```

### 2. Update `src/pages/Onboarding.tsx` - Improve Error Recovery

Enhance the onboarding flow to:
- Show clearer error messages when upload fails
- Provide a retry or skip option after failure
- Add step-level console logging

---

## Technical Details

### File 1: `src/hooks/useProfile.ts`

Replace the fetch call section with timeout-protected version:

```typescript
// Create abort controller for timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => {
  controller.abort();
}, 15000); // 15 second timeout

try {
  console.log('Upload: Starting fetch with 15s timeout...');
  
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/avatars/${filePath}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'x-upsert': 'true',
      },
      body: file,
      signal: controller.signal, // Add abort signal
    }
  );
  
  clearTimeout(timeoutId); // Clear timeout on success
  
  // ... rest of existing logic
} catch (err) {
  clearTimeout(timeoutId);
  
  if (err instanceof Error && err.name === 'AbortError') {
    console.error('Upload timed out after 15 seconds');
    return { 
      error: new Error('Upload timed out. Please try a smaller image or check your connection.'), 
      url: null 
    };
  }
  
  console.error('Avatar upload exception:', err);
  return { error: err as Error, url: null };
}
```

### File 2: `src/pages/Onboarding.tsx`

Enhance error handling in `handleNext`:

```typescript
const handleNext = async () => {
  setLoading(true);

  try {
    if (step === 1 && avatarFile) {
      console.log('Onboarding: Starting avatar upload...');
      const { error } = await uploadAvatar(avatarFile);
      console.log('Onboarding: Avatar upload result:', { error: error?.message || null });
      
      if (error) {
        toast({
          title: "Upload failed",
          description: `${error.message} You can skip this step and add a photo later.`,
          variant: "destructive",
        });
        setLoading(false);
        return; // Stay on step 1 to allow retry or skip
      }
    }

    // Advance to next step
    if (step < 3) {
      setStep(step + 1);
    } else {
      await handleComplete();
    }
  } catch (err) {
    console.error('Onboarding step error:', err);
    toast({
      title: "Something went wrong",
      description: "Please try again or skip this step.",
      variant: "destructive",
    });
  } finally {
    setLoading(false); // Always reset loading state
  }
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useProfile.ts` | Add AbortController timeout to fetch, improve error messages |
| `src/pages/Onboarding.tsx` | Enhance error toast messages to suggest skip option |

---

## Expected Behavior After Fix

| Scenario | Result |
|----------|--------|
| Upload succeeds | Advances to next step |
| Upload times out (>15s) | Shows "Upload timed out" error, user can retry or skip |
| Network error | Shows error message, user can retry or skip |
| Session not ready | Shows "Session not ready" error after 3 retries |

## Acceptance Criteria Met

- App never gets stuck on "Saving..."
- Clear error messages shown on failure
- "Skip for now" always available as escape hatch
- All async operations resolve or fail within 15 seconds
- Console logging at each step for debugging
