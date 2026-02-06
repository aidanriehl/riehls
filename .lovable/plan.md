

# Fix: React Router forwardRef Warning

## Problem

The console shows a warning about function components not being able to receive refs:

```
Warning: Function components cannot be given refs. Attempts to access this ref will fail. 
Did you mean to use React.forwardRef()?

Check the render method of `App`.
    at Onboarding
    at ProtectedRoute
```

This warning occurs because React Router v6 internally attempts to pass refs to route elements, and both `ProtectedRoute` and the page components are regular function components that don't handle refs.

## Root Cause

The `ProtectedRoute` component returns either:
- A `<Navigate>` component (which itself doesn't accept refs)
- Children wrapped in a React fragment `<>{children}</>`

When React Router tries to attach a ref to track the rendered element, it triggers this warning.

## Solution

Wrap `ProtectedRoute` with `React.forwardRef` to properly handle any refs passed by React Router. Since we don't actually need to use the ref, we can simply accept and ignore it while still satisfying React's requirements.

---

## Changes Required

### File: `src/components/ProtectedRoute.tsx`

Convert the component to use `forwardRef`:

```typescript
import { useState, useEffect, forwardRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
  requireAdmin?: boolean;
}

export const ProtectedRoute = forwardRef<HTMLDivElement, ProtectedRouteProps>(
  function ProtectedRoute(
    { children, requireOnboarding = true, requireAdmin = false },
    ref
  ) {
    // ... existing logic stays the same
    
    // Update the loading return to accept the ref:
    if ((authLoading || profileLoading) && !loadingTimeout) {
      return (
        <div ref={ref} className="h-screen w-full flex items-center justify-center bg-background">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      );
    }
    
    // For other returns, wrap in a div that accepts ref
    // ... (see implementation details below)
  }
);
```

---

## Technical Details

| Current | After Fix |
|---------|-----------|
| Regular function component | `forwardRef` wrapped component |
| Returns fragments `<>{children}</>` | Returns content that can accept ref |
| Warning in console | Clean console |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ProtectedRoute.tsx` | Wrap with `forwardRef`, attach ref to wrapper elements |

---

## Expected Result

- The "Function components cannot be given refs" warning will be resolved
- No functional changes to the routing behavior
- Clean console output on the onboarding page

