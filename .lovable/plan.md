

# riehls Enhancement Plan

## Overview
This plan enhances the riehls app with Instagram-style features including better video metadata display, a clickable creator profile with a playful "unfollow" joke, an enhanced share experience with DM functionality, and various UI refinements.

---

## Features to Implement

### 1. Video Caption Enhancements

**Add date display under caption**
- Format: "Jan 15" (month and day, no year)
- Uses the existing `createdAt` field from video data

**Add clickable @aidan username above caption**
- Displays `@aidan` (lowercase) above the caption
- When tapped, navigates to your creator profile page

**Ensure chronological sorting**
- Videos sorted newest first (by `createdAt` descending)
- Currently videos are displayed in array order - will add explicit sorting

---

### 2. Creator Profile Page (New Route)

**Create `/creator` route for your public profile**
- Avatar image (larger, centered)
- Display name: "Aidan" 
- Username: @aidan
- Bio section
- Stats row (posts count, followers, following)
- "Follow" button with special behavior:
  - If already following: Shows confirmation dialog
  - Dialog text: "Are you sure? 🤔"
  - "Unfollow" option links to Venmo (`venmo.com/aidanriehll?txn=pay&amount=5&note=Unfollow%20fee`)
  - "Stay Following" closes dialog

---

### 3. Header UI Updates

**Increase "riehls" title size by 20%**
- Change from `text-lg` to approximately `text-xl` with slightly larger font size
- Move down a few pixels (adjust top positioning)

---

### 4. Enhanced Share Feature

**Share sheet with multiple options:**
1. **Copy Link** - Copy video URL to clipboard
2. **Share via Text** - Opens native share (SMS/text on mobile)
3. **DM Aidan** - Opens in-app messaging

**DM System (requires database):**
- New route: `/messages`
- Simple chat interface between viewer and creator (you)
- Message list with timestamps
- Input field to compose message
- Messages stored in database with sender/receiver IDs

---

## Implementation Approach

### Phase 1: UI Enhancements (No Backend Needed)
1. Update `VideoCaption.tsx` to include:
   - Clickable `@aidan` username linking to `/creator`
   - Date display formatted as "MMM D"
2. Update `Index.tsx` header styling
3. Create `CreatorProfile.tsx` page with follow button + Venmo dialog
4. Sort videos by `createdAt` in `useVideos.ts`
5. Add `/creator` route to `App.tsx`

### Phase 2: Share Sheet Enhancement
1. Create `ShareSheet.tsx` component with options
2. Update `VideoPlayer.tsx` to use new share sheet
3. Options: Copy Link, Share via Text, DM Aidan

### Phase 3: DM System (Requires Lovable Cloud)
1. Enable Lovable Cloud for database
2. Create `messages` table with schema:
   - `id`, `sender_id`, `receiver_id`, `content`, `created_at`, `is_read`
3. Create `/messages` page with chat UI
4. Build message sending/receiving functionality

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/components/VideoCaption.tsx` | Add @aidan link, date display, accept `createdAt` prop |
| `src/components/VideoPlayer.tsx` | Pass date to caption, use new share sheet |
| `src/pages/Index.tsx` | Increase header font size, adjust positioning |
| `src/hooks/useVideos.ts` | Sort videos by date (newest first) |
| `src/pages/CreatorProfile.tsx` | **New** - Public creator profile with follow button |
| `src/components/ShareSheet.tsx` | **New** - Share options with Copy, Text, DM |
| `src/components/UnfollowDialog.tsx` | **New** - Dialog with Venmo link joke |
| `src/pages/Messages.tsx` | **New** - DM chat interface |
| `src/App.tsx` | Add `/creator` and `/messages` routes |
| `src/data/mockData.ts` | Update creator data for Aidan |

---

## Technical Details

### Date Formatting
```typescript
import { format } from 'date-fns';
const formattedDate = format(new Date(video.createdAt), 'MMM d');
// Output: "Jan 15"
```

### Venmo Deep Link
```
https://venmo.com/aidanriehll?txn=pay&amount=5&note=Unfollow%20fee
```

### Video Sorting
```typescript
const sortedVideos = [...mockVideos].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);
```

---

## Questions Addressed

| Request | Solution |
|---------|----------|
| Date under caption | Month + day format using date-fns |
| Chronological order | Sort by `createdAt` descending |
| @aidan above caption | Clickable link to `/creator` |
| Follow/unfollow button | Follow button + Venmo dialog joke |
| riehls title bigger | 20% larger font, moved lower |
| Friends tab | Removed per your request |
| Share to text | Native share API integration |
| DM feature | Full chat system (requires database) |

---

## Next Steps After Approval

1. I'll implement Phase 1 and Phase 2 immediately (UI and share features)
2. For the DM system (Phase 3), we'll need to enable Lovable Cloud to set up the database for storing messages

