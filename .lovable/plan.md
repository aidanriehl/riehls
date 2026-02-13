

## Pin Videos to Top of Grid

### What it does
Adds the ability for the admin/creator to pin videos so they appear first in the video grid on both the Profile and Creator Profile pages. A blue "Pin" button will appear next to the red "Delete" button on videos in the feed (admin only).

### How it works
- Pinned videos sort to the top of the grid
- Tapping "Pin" on an already-pinned video will "Unpin" it
- The button text toggles between "Pin" and "Unpin"

### Technical Details

**1. Database migration** -- Add `is_pinned` column to `videos` table:
```sql
ALTER TABLE public.videos ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;
```

**2. VideoCaption.tsx** -- Add a blue "Pin/Unpin" button next to the red "Delete" button (admin only):
- New prop: `isPinned: boolean` and `onPin: () => void`
- Blue text button showing "Pin" or "Unpin" based on current state

**3. ReelsFeed.tsx / Index.tsx** -- Pass `isPinned` and `onPin` handler to VideoCaption, calling a toggle function that updates the database.

**4. useVideos.ts** -- Add a `togglePin` function:
- Optimistic local state update of `isPinned`
- Supabase update: `UPDATE videos SET is_pinned = !current WHERE id = videoId`

**5. Profile.tsx** -- Sort `myVideos` so pinned videos appear first in the grid. Optionally show a small pin icon overlay on pinned thumbnails.

**6. CreatorProfile.tsx** -- Fetch `is_pinned` alongside other video fields, sort pinned videos first in the grid.

**7. Types update** -- Add `isPinned` to the `VideoWithCreator` interface in `useVideos.ts`.

