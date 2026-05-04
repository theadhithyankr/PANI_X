# Inbox Unread Indicator - Implementation Summary

## Problem
The inbox had a static red dot indicator that never updated, even when messages were viewed. Users couldn't tell if they had new unread items.

## Solution
Implemented a dynamic unread counter that:
- Tracks unread messages, application updates, and scheduled interviews
- Updates in real-time when items are viewed
- Shows the actual count instead of a static indicator
- Automatically marks items as read when viewed

## Files Modified

### 1. `src/hooks/useSupabase.ts`
**Changes to `useInbox` hook:**
- Added `unreadCount` state variable
- Modified inbox fetching to count unread items:
  - Scheduled interviews (always unread)
  - Application updates with `is_viewed = false`
  - Messages with `is_read = false`
- Added `markApplicationAsViewed()` function
- Returns `unreadCount` and `markApplicationAsViewed`

**Changes to `useMessages` hook:**
- Added `markMessagesAsRead()` function
- Modified `fetchMessages()` to auto-mark messages as read when chat opens
- Returns `markMessagesAsRead` function

### 2. `src/pages/Inbox.tsx`
- Updated to destructure `unreadCount` and `markApplicationAsViewed` from `useInbox()`
- Modified `handleAction()` to mark applications as viewed when "View Details" is clicked
- Messages automatically marked as read via `fetchMessages()` in ChatInterface

### 3. `src/components/dashboard/SideMenu.tsx`
- Added `useInbox` import and hook usage
- Destructured `unreadCount` from hook
- Updated badge rendering:
  - Shows numeric count (e.g., "3") when unread items exist
  - Shows "99+" when count exceeds 99
  - Hides badge when count is 0
  - Changed from static red dot to dynamic number badge

### 4. `src/components/ChatInterface.tsx`
- No changes needed (already uses `fetchMessages` which now marks messages as read)

## Files Created

### 1. `supabase/add_is_viewed_to_applications.sql`
SQL migration to add `is_viewed` column to applications table:
- Adds `is_viewed BOOLEAN DEFAULT FALSE` column
- Creates index for performance: `idx_applications_is_viewed`
- Adds column documentation comment

### 2. `INBOX_UPDATE_README.md`
Comprehensive documentation including:
- Overview of changes
- Detailed breakdown of modifications
- Database migration instructions
- How the system works
- Testing guidelines
- Future enhancement ideas

### 3. `IMPLEMENTATION_SUMMARY.md`
This file - quick reference for the implementation

## Database Changes Required

**IMPORTANT:** Run this SQL migration before using the updated code:

```sql
-- Add is_viewed column to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS is_viewed BOOLEAN DEFAULT FALSE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_applications_is_viewed 
ON applications(candidate_id, is_viewed) 
WHERE is_viewed = FALSE;
```

Location: `supabase/add_is_viewed_to_applications.sql`

## How to Deploy

1. **Apply Database Migration:**
   ```bash
   # Using Supabase CLI
   supabase db push supabase/add_is_viewed_to_applications.sql
   
   # OR manually in Supabase Dashboard SQL Editor
   ```

2. **Deploy Code Changes:**
   - All TypeScript changes are backward compatible
   - No breaking changes to existing functionality
   - Real-time updates work automatically via existing Supabase subscriptions

3. **Verify:**
   - Check inbox badge shows correct count
   - Test marking messages as read
   - Test marking applications as viewed
   - Verify real-time updates work

## Technical Details

### Unread Count Logic
```typescript
// Interviews: Always counted as unread
unread += interviews.length;

// Applications: Only if not viewed
if (!app.is_viewed) unread++;

// Messages: Only if not read
if (!msg.is_read) unread++;
```

### Mark as Read Flow

**Messages:**
1. User opens chat with someone
2. `ChatInterface` calls `fetchMessages(otherId)`
3. `fetchMessages` automatically calls `markMessagesAsRead()`
4. All messages from that sender marked as read
5. Inbox refreshes via real-time subscription

**Applications:**
1. User clicks "View Details" on application
2. `handleAction()` extracts application ID
3. Calls `markApplicationAsViewed(appId)`
4. Updates `is_viewed = true` in database
5. Calls `fetchInbox()` to refresh count

### Real-time Updates
The system uses Supabase real-time subscriptions on:
- `interviews` table
- `applications` table  
- `messages` table

Any changes trigger automatic refresh of inbox data and unread count.

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Inbox badge shows correct initial count
- [ ] Opening chat marks messages as read
- [ ] Badge count decreases after reading messages
- [ ] Clicking "View Details" marks application as viewed
- [ ] Badge count decreases after viewing application
- [ ] Badge shows "99+" for counts over 99
- [ ] Badge hides when count reaches 0
- [ ] Real-time updates work (test with two accounts)
- [ ] No TypeScript errors
- [ ] No console errors

## Performance Considerations

- Added database index on `(candidate_id, is_viewed)` for fast queries
- Partial index (WHERE is_viewed = FALSE) keeps index small
- Real-time subscriptions reuse existing channels
- No additional API calls beyond existing patterns

## Browser Compatibility

- Uses standard React hooks (useState, useEffect)
- No special browser APIs required
- Works on all modern browsers
- Mobile responsive (badge scales appropriately)

## Future Enhancements

1. **Interview Tracking:** Add `is_viewed` to interviews table
2. **Thread Grouping:** Group messages by conversation
3. **Mark All Read:** Bulk action to clear all unread items
4. **Push Notifications:** Browser notifications for new items
5. **Unread Filters:** Filter inbox to show only unread items
6. **Read Receipts:** Show when employer reads candidate messages
7. **Notification Preferences:** Let users customize what counts as "unread"

## Rollback Plan

If issues occur:

1. **Code Rollback:**
   ```bash
   git revert <commit-hash>
   ```

2. **Database Rollback:**
   ```sql
   DROP INDEX IF EXISTS idx_applications_is_viewed;
   ALTER TABLE applications DROP COLUMN IF EXISTS is_viewed;
   ```

3. **Partial Rollback:**
   - Can keep database changes and revert code
   - System will work with old code (column just unused)
   - No data loss or corruption risk
