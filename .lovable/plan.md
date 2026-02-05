
# Fix Onboarding Photo Upload "Saving..." Stuck Issue

## Problem Summary
When you upload a profile photo during onboarding and click "Continue," the button shows "Saving..." and never completes. The upload starts but silently fails, leaving you stuck.

## Root Cause
After investigating the database, storage bucket, and code:

1. **Your profile record exists** - The signup trigger correctly created your profile
2. **Storage bucket exists and is public** - Configuration is correct
3. **The upload starts** - Console shows "Uploading avatar to: [user-id]/avatar.png"
4. **But no files arrive** - The storage bucket is empty
5. **The storage policy may be rejecting uploads silently** - The RLS policy comparison could be failing

The storage INSERT policy uses a path-matching function that may not be evaluating correctly, causing the upload to fail without a clear error.

## Solution

### 1. Fix Storage Policies (Database Change)
Replace the current storage policies with simpler, more reliable ones that explicitly check the authenticated user can upload to their own folder:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Simpler INSERT policy using path prefix check
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (SPLIT_PART(name, '/', 1) = auth.uid()::text)
);

-- UPDATE policy
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND
  (SPLIT_PART(name, '/', 1) = auth.uid()::text)
);

-- DELETE policy
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  (SPLIT_PART(name, '/', 1) = auth.uid()::text)
);

-- Public read access
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

### 2. Add Upload Timeout and Better Error Handling (Code Change)
Update `src/hooks/useProfile.ts` to add a timeout wrapper around the storage upload:

- Add a 30-second timeout to prevent infinite hanging
- Log more detailed error information
- Ensure errors always propagate back to the UI

### 3. Improve Onboarding Error Recovery (Code Change)
Update `src/pages/Onboarding.tsx`:

- Always reset loading state after any operation (success or failure)
- Add a retry mechanism with clearer feedback
- Show specific error messages when storage upload fails

## Files to Change
1. **New migration** - Fix storage RLS policies with `SPLIT_PART` instead of `storage.foldername`
2. **src/hooks/useProfile.ts** - Add timeout wrapper and better error handling
3. **src/pages/Onboarding.tsx** - Ensure loading state is always cleared

## Technical Details

The `storage.foldername()` function is a built-in Supabase helper, but using PostgreSQL's `SPLIT_PART(name, '/', 1)` is more predictable:
- `name` = `79b5f8ab-c311-4f2c-b001-f1f638fb1e6a/avatar.png`
- `SPLIT_PART(name, '/', 1)` = `79b5f8ab-c311-4f2c-b001-f1f638fb1e6a`
- Compare against `auth.uid()::text` for user-scoped uploads

For the timeout, we'll wrap the Supabase storage call:
```typescript
const uploadWithTimeout = (promise: Promise<any>, ms: number) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Upload timed out')), ms)
  );
  return Promise.race([promise, timeout]);
};
```
