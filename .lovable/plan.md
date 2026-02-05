
# Fix: Loading State Stuck on Home Page

## Problem Identified

The app is stuck on the "Loading..." screen because of a timing issue between authentication and profile loading:

1. The `ProtectedRoute` waits for BOTH `authLoading` AND `profileLoading` to be false
2. The `useProfile` hook starts with `loading: true` and depends on `user` from `useAuth`
3. There's a brief moment where `user` changes but `profileLoading` hasn't finished yet
4. Also, your profile has `onboarding_complete: false`, so you should be redirected to onboarding - but you're not seeing that either

The core issue: when `useProfile`'s `useEffect` runs with a valid `user`, it calls `fetchProfile()` which sets `loading: true` again, but if there's any issue with the query, loading may not complete properly.

## Solution

I'll make two fixes:

### Fix 1: Improve `useProfile` loading logic
- Don't re-set `loading: true` inside `fetchProfile()` when already loading
- Add error handling that still sets `loading: false` on failure
- Initialize loading based on whether there's already a user

### Fix 2: Add timeout protection in `ProtectedRoute`
- Add a safety timeout so loading never gets permanently stuck
- If loading takes more than 5 seconds, proceed with what we have

---

## Technical Changes

### File: `src/hooks/useProfile.ts`

**Current Issue:**
```typescript
const fetchProfile = async () => {
  if (!user) return;
  setLoading(true);  // This can cause loading to reset unexpectedly
  // ...
};
```

**Fix:**
```typescript
useEffect(() => {
  let isMounted = true;
  
  const loadProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (isMounted) {
        if (error) {
          console.error('Error fetching profile:', error);
        }
        setProfile(data);
        setLoading(false);
      }
    } catch (err) {
      if (isMounted) {
        console.error('Profile fetch error:', err);
        setLoading(false);
      }
    }
  };

  loadProfile();
  
  return () => { isMounted = false; };
}, [user]);
```

### File: `src/components/ProtectedRoute.tsx`

Add a loading timeout as a safety net:

```typescript
const [loadingTimeout, setLoadingTimeout] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => setLoadingTimeout(true), 5000);
  return () => clearTimeout(timer);
}, []);

// In render - proceed if timeout OR loading complete
if ((authLoading || profileLoading) && !loadingTimeout) {
  return <LoadingScreen />;
}
```

---

## After the Fix

Once implemented:
- The loading screen will properly transition
- Since your `onboarding_complete` is `false`, you'll be redirected to `/onboarding`
- Complete the onboarding steps to set up your profile
- Then you'll be able to access the main feed

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/hooks/useProfile.ts` | Fix loading state management, add cleanup |
| `src/components/ProtectedRoute.tsx` | Add timeout safety for loading states |
