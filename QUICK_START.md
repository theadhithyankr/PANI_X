# Quick Start - Inbox Unread Indicator Fix

## What Was Fixed
The inbox now shows a **dynamic unread count** instead of a static red dot. The count updates automatically when you:
- View messages in chat
- Click "View Details" on application updates
- Receive new items in real-time

## Before You Start

### 1. Apply Database Migration
Run this SQL in your Supabase dashboard or CLI:

```sql
-- Add is_viewed column to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS is_viewed BOOLEAN DEFAULT FALSE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_applications_is_viewed 
ON applications(candidate_id, is_viewed) 
WHERE is_viewed = FALSE;
```

**File location:** `supabase/add_is_viewed_to_applications.sql`

### 2. That's It!
The code changes are already in place. Just deploy and test.

## What Changed

### Visual Changes
**Before:** Static red dot on Inbox menu item
```
Inbox •
```

**After:** Dynamic count badge (or nothing if no unread items)
```
Inbox 5      (when you have 5 unread items)
Inbox 99+    (when you have 100+ unread items)
Inbox        (when you have 0 unread items)
```

### Behavior Changes

1. **Opening Chat:**
   - All messages from that person are marked as read
   - Badge count decreases automatically

2. **Viewing Application Details:**
   - Application status update is marked as viewed
   - Badge count decreases automatically

3. **Real-time Updates:**
   - New messages, interviews, or application updates increase the count
   - Works across browser tabs/windows

## Testing

### Quick Test (5 minutes)

1. **Check Initial State:**
   - Look at the Inbox menu item
   - Should show a number if you have unread items

2. **Test Message Reading:**
   - Note the current count
   - Open a chat with someone who sent you messages
   - Close the chat
   - Count should decrease

3. **Test Application Viewing:**
   - Note the current count
   - Click "View Details" on an application with "NEW" badge
   - Count should decrease

4. **Test Real-time (optional):**
   - Open app in two browser windows
   - Send a message from one account to another
   - Watch the badge update in real-time

## Troubleshooting

### Badge Not Showing
- Check if you have any unread items in the inbox
- Badge only shows when count > 0

### Count Not Decreasing
- Verify database migration was applied
- Check browser console for errors
- Ensure Supabase real-time is enabled

### Count Seems Wrong
- Refresh the page
- Check if you have:
  - Unread messages (is_read = false)
  - Unviewed applications (is_viewed = false)
  - Scheduled interviews (always counted)

## Files Modified

Only 3 files were changed:
1. `src/hooks/useSupabase.ts` - Added unread counting logic
2. `src/pages/Inbox.tsx` - Added mark-as-viewed functionality
3. `src/components/dashboard/SideMenu.tsx` - Updated badge display

## Rollback

If you need to undo these changes:

```bash
# Revert code changes
git revert <commit-hash>

# Remove database column (optional)
ALTER TABLE applications DROP COLUMN IF EXISTS is_viewed;
DROP INDEX IF EXISTS idx_applications_is_viewed;
```

## Need More Info?

- **Full details:** See `INBOX_UPDATE_README.md`
- **Implementation details:** See `IMPLEMENTATION_SUMMARY.md`
- **Database migration:** See `supabase/add_is_viewed_to_applications.sql`

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify database migration was applied
3. Ensure Supabase connection is working
4. Check that real-time subscriptions are enabled in Supabase

---

**That's it!** The inbox unread indicator is now fully functional. 🎉
