

# Robust Profile Photo Upload for Onboarding

## Current Status

Based on the network logs and database, **the upload is currently working**. The logs show:
- Storage upload: `200 OK` ✓
- Profile update: `204 No Content` ✓
- Database shows `avatar_url` is saved ✓

However, the current implementation can be improved to meet your specified requirements for a more reliable, persistent flow.

---

## Issues to Address

| Current Behavior | Required Behavior |
|------------------|-------------------|
| No file size validation | Max 5MB file size |
| Avatar URL stored in `uploadAvatar` but not tracked in onboarding state | Persistent `profileImageUrl` state in onboarding |
| Navigation happens even if upload fails silently | Navigate ONLY after confirmed database success |
| No visual confirmation that photo was saved | Clear feedback that photo is saved |

---

## Implementation Plan

### File: `src/pages/Onboarding.tsx`

#### 1. Add File Size Validation (5MB max)

Add validation in `handleAvatarChange` to reject files larger than 5MB:

```typescript
const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Validate file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      toast({
        title: "File too large",
        description: "Please choose an image under 5MB",
        variant: "destructive",
      });
      return;
    }
    
    setAvatarFile(file);
    // ... rest of preview logic
  }
};
```

#### 2. Add Persistent Image URL State

Track the uploaded URL to ensure it persists across the flow:

```typescript
const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
```

#### 3. Refactor Upload Flow for Reliability

Modify `handleNext` to:
1. Upload the image
2. **Store the returned URL in state**
3. **Verify the profile was updated** before advancing
4. Only advance after all steps succeed

```typescript
const handleNext = async () => {
  setLoading(true);

  try {
    if (step === 1 && avatarFile && !uploadedAvatarUrl) {
      console.log('Onboarding: Starting avatar upload...');
      const { error, url } = await uploadAvatar(avatarFile);
      
      if (error) {
        toast({
          title: "Upload failed",
          description: `${error.message} You can skip this step and add a photo later.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Save the URL to persistent state
      if (url) {
        setUploadedAvatarUrl(url);
        console.log('Onboarding: Avatar URL saved to state:', url);
      }
      
      // Refetch profile to confirm the update succeeded
      await refetch();
    }

    // Advance to next step only after success
    if (step < 3) {
      setStep(step + 1);
    } else {
      await handleComplete();
    }
  } catch (err) {
    console.error('Onboarding step error:', err);
    toast({
      title: "Something went wrong",
      description: err instanceof Error ? err.message : "Please try again",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
```

#### 4. Skip Re-Upload if Already Done

If the user has already uploaded and returns to step 1, don't upload again:

```typescript
// In handleNext, check if already uploaded:
if (step === 1 && avatarFile && !uploadedAvatarUrl) {
  // Do upload
}
// If uploadedAvatarUrl already exists, just advance
```

---

## Flow Diagram

```text
User selects image
       |
       v
Validate size < 5MB ──[too large]──> Show error, stay on step
       |
       v (valid)
Save file to state + show preview
       |
       v
User clicks Continue
       |
       v
Upload to storage
       |
       v
Success? ──[no]──> Show error, stay on step (allow retry/skip)
       |
       v (yes)
Save URL to uploadedAvatarUrl state
       |
       v
Update profile with avatar_url
       |
       v
Refetch profile to confirm
       |
       v
Advance to step 2
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Onboarding.tsx` | Add file size validation, persistent URL state, and confirmation logic |

---

## Expected Results

| Scenario | Result |
|----------|--------|
| File > 5MB | Shows "File too large" error, doesn't upload |
| Upload succeeds | URL saved to state, profile updated, advances to step 2 |
| Upload fails | Shows error, stays on step 1, user can retry or skip |
| User already uploaded | Skips re-upload on returning to step 1 |

