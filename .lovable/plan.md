
# Enhanced Messaging Feature - Instagram-Style DMs

## Overview
Transform the messaging interface to match Instagram's DM experience with suggestion bubbles, message reactions, swipe gestures for timestamps and replies, and updated styling.

## Changes Summary

### 1. Remove Initial Message
Start with an empty conversation instead of the default "Hey! Thanks for checking out my content" message.

### 2. Add Suggestion Bubbles
Add 3 clickable suggestion chips above the input area:
- "low key you're bad" (with devil emoji)
- "You up?"
- "like for tbh?"

When tapped, the suggestion text populates the message input field.

### 3. Message Reactions (Liking DMs)
- Double-tap on any message to "like" it
- Show a red heart emoji below the liked message (matching Instagram's style from your screenshot)
- Track liked state per message

### 4. Sent Message Color Update
Change sent messages from the current blue (`bg-primary`) to a purple/violet color matching Instagram's DM bubble color shown in your screenshot (approximately `#7C3AED` or similar violet).

### 5. Hidden Timestamps with Swipe-to-Reveal
- Hide timestamps by default
- Swipe left on a message to reveal the timestamp on the right side
- Timestamp slides in smoothly, then hides after a moment or when user swipes back

### 6. Reply-to-Message Feature
- Swipe right on received messages (left messages) to trigger reply mode
- Swipe left on sent messages (right messages) to trigger reply mode  
- Show a curved reply arrow icon during swipe (as in your 5th screenshot)
- Trigger haptic feedback using `navigator.vibrate()` when threshold is reached
- Enter reply mode: show the message being replied to above the input field
- Sent reply displays with a preview of the original message

---

## Technical Details

### Updated Message Interface
```typescript
interface Message {
  id: string;
  content: string;
  isFromCreator: boolean;
  timestamp: Date;
  isLiked: boolean;           // New: track heart reaction
  replyToId?: string;         // New: ID of message being replied to
}
```

### State Management
```typescript
const [messages, setMessages] = useState<Message[]>([]); // Start empty
const [newMessage, setNewMessage] = useState('');
const [replyingTo, setReplyingTo] = useState<Message | null>(null);
const [revealedTimestamp, setRevealedTimestamp] = useState<string | null>(null);
```

### Suggestion Bubbles Component
Positioned above the input area, horizontally scrollable row of pill-shaped buttons.

### Swipe Gesture Handling
Use touch event handlers (`onTouchStart`, `onTouchMove`, `onTouchEnd`) to track horizontal swipe distance:
- **Timestamp reveal**: Swipe left > 50px threshold
- **Reply trigger**: Swipe right > 80px threshold with haptic feedback

### CSS Additions
New CSS for:
- Suggestion bubble styling
- Heart reaction positioning below messages
- Swipe animation for messages
- Reply preview styling above input
- Purple/violet color for sent messages

### Files to Modify
- `src/pages/Messages.tsx` - Main implementation
- `src/index.css` - Add swipe animations and new color variable for sent messages

