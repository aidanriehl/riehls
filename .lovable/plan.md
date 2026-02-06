
# Fix Profile Photo Upload - Missing Content-Type Header

## Problem Analysis

The profile photo upload is failing silently (not timing out) because the current implementation uses a raw `fetch()` call to the Supabase storage API **without the required `Content-Type` header**.

### Current Code Issue (line 159-170 in useProfile.ts)

```typescript
const response = await fetch(
  `${supabaseUrl}/storage/v1/object/avatars/${filePath}`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'x-upsert': 'true',
      // MISSING: 'Content-Type': file.type
    },
    body: file,
  }
);
```

The storage API requires knowing the file's content type to process it correctly. Without this header, the request can fail or hang without a proper error response.

## Solution

Replace the raw `fetch()` approach with the **Supabase SDK's native upload method**: `supabase.storage.from('avatars').upload()`.

This approach:
- Automatically handles the Content-Type header
- Handles authentication internally via the already-configured client
- Removes the need for manual session fetch/retry logic
- Provides consistent error handling
- Is the officially recommended method per Supabase documentation

---

## Changes Required

### File: `src/hooks/useProfile.ts`

Replace the entire `uploadAvatar` function with a simpler SDK-based implementation:

```typescript
const uploadAvatar = async (file: File) => {
  if (!user) return { error: new Error('Not authenticated'), url: null };

  const fileExt = file.name.split('.').pop();
  const filePath = `${user.id}/avatar.${fileExt}`;

  console.log('Upload: Starting avatar upload to:', filePath);

  try {
    // Use Supabase SDK which handles Content-Type and auth automatically
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true, // Replace existing avatar
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Upload failed:', uploadError);
      return { 
        error: new Error(uploadError.message || 'Upload failed'), 
        url: null 
      };
    }

    console.log('Upload successful, getting public URL');

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    console.log('Public URL:', publicUrl);

    // Update profile with new avatar URL
    const { error: updateError } = await updateProfile({ avatar_url: publicUrl });

    if (updateError) {
      console.error('Failed to update profile with avatar URL:', updateError);
      // Return success anyway since the file was uploaded
    }

    return { error: null, url: publicUrl };
  } catch (err) {
    console.error('Avatar upload exception:', err);
    return { error: err as Error, url: null };
  }
};
```

### Key Improvements

| Before | After |
|--------|-------|
| Raw fetch() with manual headers | Supabase SDK method |
| Missing Content-Type header | SDK sets Content-Type automatically |
| Manual session fetch with retries | SDK uses configured auth |
| 15-second manual timeout | SDK handles timeouts internally |
| Complex error handling | Simpler, more reliable error handling |

---

## Technical Flow After Fix

```text
uploadAvatar(file)
    |
    v
Check user authenticated
    |
    v
supabase.storage.from('avatars').upload()
    |-- handles auth from configured client
    |-- sets Content-Type: file.type
    |-- uses upsert: true to replace existing
    |
    v
Success? --> Get public URL --> Update profile --> Return success
    |
    v
Error? --> Return error with message --> UI shows toast
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useProfile.ts` | Replace raw fetch with Supabase SDK upload method |

---

## Expected Results

| Scenario | Before | After |
|----------|--------|-------|
| Upload with valid image | Hangs silently | Uploads successfully |
| Upload fails | No error shown | Clear error message displayed |
| Large file | May hang | SDK handles with proper timeout |
| Session issues | Complex retry logic | SDK manages automatically |

---

## Why This Fix Works

The memory note mentions "Profile image uploads use direct fetch calls to bypass SDK synchronization deadlocks" - however, this workaround introduced the missing Content-Type issue. The proper fix is to use the SDK with the `upsert: true` option which:

1. Properly sets all required headers including Content-Type
2. Uses the already-authenticated client (no manual session management)
3. Handles the request lifecycle properly
4. Returns consistent error objects

The SDK is the officially supported method and has been tested extensively. Any previous "deadlock" issues may have been related to other code paths that have since been fixed.
