

# Onboarding Background Image Implementation

## Overview
Add the uploaded photo as a full-screen background image on the onboarding page, positioned so the pointing finger aims at the "riehls" logo, with a dark overlay for text readability.

## Visual Goal
Based on your mockup:
- Full-screen background image covering the entire viewport
- Dark overlay (approximately 60-70% opacity) to ensure white text remains readable
- Image positioned and scaled so the finger points upward toward the logo area
- Form elements floating on top with their existing semi-transparent styling

## Implementation Steps

### Step 1: Copy Image to Project
- Copy `user-uploads://IMG_1505.JPG` to `src/assets/onboarding-bg.jpg`
- Using src/assets allows proper bundling and optimization

### Step 2: Update Onboarding.tsx
- Import the background image as an ES6 module
- Add an absolute-positioned background container with:
  - The image set as background with `object-cover` to fill the screen
  - Positioning adjusted using `object-position` (e.g., `center 30%`) to frame the finger pointing upward
  - A dark overlay layer (`bg-black/60`) on top of the image
- Keep the existing form content positioned above the overlay
- Remove the solid `bg-background` class from the main container

### Technical Details

**Background structure:**
```
Container (relative, min-h-screen)
├── Background Image (absolute, inset-0, z-0)
├── Dark Overlay (absolute, inset-0, z-10, bg-black/60)
└── Content (relative, z-20, existing form)
```

**Image positioning:**
- Use `object-cover` to fill the viewport while maintaining aspect ratio
- Use `object-position: center 30%` (adjustable) to shift the image so the finger and face are positioned correctly relative to the logo

