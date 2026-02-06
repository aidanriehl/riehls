

# Convert Uploaded Images to JPEG for Compatibility

## Problem

Your friend identified the issue correctly - certain image formats (especially Apple's HEIC) are not well supported by:
- Web browsers (can't display HEIC natively)
- Storage systems (may reject or mishandle HEIC files)

Currently, the app preserves whatever format the user uploads, which causes failures with HEIC and other uncommon formats.

## Solution

Convert all uploaded images to JPEG format before uploading to storage using the HTML Canvas API. This approach:
- Works entirely in the browser (no server-side processing needed)
- Ensures maximum compatibility across all devices
- Often reduces file size due to JPEG compression
- Guarantees the image can be displayed in any browser

---

## Changes Required

### File: `src/hooks/useProfile.ts`

Add a helper function to convert any image to JPEG:

```typescript
const convertToJpeg = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert image'));
        },
        'image/jpeg',
        0.9  // 90% quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};
```

Update `uploadAvatar` to use this conversion:

```typescript
const uploadAvatar = async (file: File) => {
  // ... auth check
  
  // Always use .jpg extension since we convert to JPEG
  const filePath = `${user.id}/avatar.jpg`;
  
  // Convert image to JPEG for maximum compatibility
  const jpegBlob = await convertToJpeg(file);
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, jpegBlob, {
      contentType: 'image/jpeg',
      upsert: true,
      cacheControl: '3600',
    });
  
  // ... rest of function
};
```

### File: `src/pages/Onboarding.tsx`

Update the file input to be more explicit about accepted types, but still allow all images since we'll convert them:

```typescript
<input
  type="file"
  accept="image/*"  // Accept all images - we convert to JPEG
  onChange={handleAvatarChange}
  className="hidden"
/>
```

No change needed here - the current `accept="image/*"` is correct.

---

## Technical Flow

```text
User selects image (any format: HEIC, PNG, WebP, etc.)
       |
       v
Validate size < 5MB
       |
       v
Show local preview (may fail for HEIC - that's OK)
       |
       v
User clicks Continue
       |
       v
convertToJpeg() runs:
  - Create Image element
  - Draw to Canvas
  - Export as JPEG blob (90% quality)
       |
       v
Upload JPEG to storage with .jpg extension
       |
       v
Success! Image displays correctly everywhere
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useProfile.ts` | Add `convertToJpeg` helper, update `uploadAvatar` to convert before upload |

---

## Edge Cases Handled

| Format | Before | After |
|--------|--------|-------|
| HEIC (iPhone) | Upload fails | Converts to JPEG, works |
| PNG | Works but large | Converts to smaller JPEG |
| WebP | May have issues | Converts to JPEG |
| JPEG | Works | No change needed (still works) |
| GIF | Works | Converts to static JPEG |

---

## Benefits

1. **Universal compatibility** - JPEG works everywhere
2. **Smaller file sizes** - JPEG compression is efficient
3. **Consistent storage** - All avatars are `.jpg` files
4. **No server-side processing** - Canvas API works in browser
5. **iPhone photos just work** - HEIC automatically converted

