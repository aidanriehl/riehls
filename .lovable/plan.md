

# UI Fixes and Updates

## Overview
This plan addresses four UI issues: fixing non-functional buttons, updating the bottom navigation, enhancing the header gradient, and removing the @ symbol from the username display.

---

## Issues & Fixes

### 1. Share Button Not Working (Home)

**Investigation:** The Share button IS properly wired up in VideoPlayer.tsx. The `handleShare` function calls `setShowShare(true)`, and the ShareSheet component is rendered with the correct props. 

**Likely cause:** The button click might be getting intercepted by the video's touch/click handlers, or there's a z-index issue.

**Fix:** Add `e.stopPropagation()` to prevent the click from bubbling to the video element, and ensure proper z-index layering.

---

### 2. Settings Button Not Working (Profile)

**Current state:** The Settings button is purely decorative - no onClick handler.

**Fix:** For now, I'll add a toast notification saying "Settings coming soon" so users know it's not broken. We can build out settings later.

---

### 3. Change "Home" to "Feed" with Bowl Icon

**Changes to BottomNav.tsx:**
- Rename label from "Home" to "Feed"
- Replace `Home` icon with `UtensilsCrossed` (fork and knife crossed - matches the food/meal theme of "riehls")

This icon fits the iconography style (simple line icons) and plays on the "reels" → "riehls" → "meals" pun.

---

### 4. Add Subtle Header Gradient

**Current state:** The header in Index.tsx is just text floating on the video with a `top-gradient` already applied in VideoPlayer.tsx.

**Fix:** The gradient already exists via `top-gradient` class in VideoPlayer.tsx (line 120). The issue is the header in Index.tsx sits on top of it. I'll enhance the gradient to be slightly more visible so "riehls" feels more integrated.

**Approach:** Adjust the `--gradient-top` CSS variable to make it subtler but more visible behind the header area.

---

### 5. Remove @ from "aidan"

**Simple change:** In VideoCaption.tsx, change `@aidan` to just `aidan`.

---

## File Changes

| File | Changes |
|------|---------|
| `src/components/VideoActions.tsx` | Add `e.stopPropagation()` to share button to prevent click bubbling |
| `src/pages/Profile.tsx` | Add toast notification to Settings button |
| `src/components/BottomNav.tsx` | Change "Home" → "Feed", use `UtensilsCrossed` icon |
| `src/components/VideoCaption.tsx` | Remove @ symbol from "aidan" |
| `src/index.css` | Adjust `--gradient-top` for subtler but more visible header gradient |

---

## Technical Details

### VideoActions.tsx - Share Button Fix
```text
Current: onClick={onShare}
Updated: onClick={(e) => { e.stopPropagation(); onShare(); }}
```

### BottomNav.tsx - Icon Change
```text
Import: UtensilsCrossed from 'lucide-react'
navItems: { icon: UtensilsCrossed, label: 'Feed', path: '/' }
```

### VideoCaption.tsx
```text
Current: @aidan
Updated: aidan
```

### index.css - Gradient Adjustment
```text
Current: --gradient-top: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%);
Updated: --gradient-top: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%);
```
Slightly stronger opacity (0.5 → 0.6) for better text contrast while remaining subtle.

