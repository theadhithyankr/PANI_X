# Inbox Unread Indicator Update

## Overview
This update fixes the inbox marker to dynamically update based on actual unread messages, interviews, and application status updates instead of showing a static indicator.

## Changes Made

### 1. Database Schema Update
- Added `is_viewed` column to the `applications` table to track when candidates view application status updates
- Added an index for better query performance on unread applications

### 2. Hook Updates (`src/hooks/useSupabase.ts`)

#### `useInbox` Hook
- Added `unreadCount` state to track total unread items
- Modified to count unread items from:
  - Scheduled interviews (always counted as unread)
  - Application status updates (based on `is_viewed` flag)
  - Direct messages (based on `is_read` flag)
- Added `markApplicationAsViewed()` function to mark applications as viewed
- Returns `unreadCount` and `markApplicationAsViewed` in addition to existing values

#### `useMessages` Hook
- Added `markMessagesAsRead()` function to mark messages as read
- Modified `fetchMessages()` to automatically mark messages as read when chat is opened
- Returns `markMessagesAsRead` in addition to existing values

### 3. UI Component Updates

#### `src/pages/Inbox.tsx`
- Updated to use `unreadCount` from `useInbox` hook
- Modified `handleAction()` to mark applications as viewed when "View Details" is clicked
- Messages are automatically marked as read when chat is opened (handled by `fetchMessages`)

#### `src/components/dashboard/SideMenu.tsx`
- Added `useInbox` hook to get real-time unread count
- Updated badge to show actual unread count instead of static red dot
- Badge now displays:
  - Number badge (e.g., "3") when there are unread items
  - "99+" when count exceeds 99
  - Nothing when count is 0

## Database Migration

To apply the database changes, run the following SQL migration:

```bash
# If using Supabase CLI
supabase db push supabase/add_is_viewed_to_applications.sql

# Or manually execute the SQL in Supabase Dashboard
```

The migration file is located at: `supabase/add_is_viewed_to_applications.sql`

## How It Works

### Unread Count Calculation
The inbox now tracks three types of unread items:

1. **Scheduled Interviews**: All scheduled interviews are counted as unread
2. **Application Updates**: Applications with status changes that haven't been viewed (`is_viewed = false`)
3. **Direct Messages**: Messages that haven't been read (`is_read = false`)

### Marking Items as Read

1. **Messages**: Automatically marked as read when the chat interface is opened
2. **Applications**: Marked as viewed when user clicks "View Details" button
3. **Interviews**: Currently counted as unread (can be enhanced to track viewed status)

### Real-time Updates
The inbox uses Supabase real-time subscriptions to automatically update when:
- New interviews are scheduled
- Application statuses change
- New messages are received

## Testing

To test the functionality:

1. Apply the database migration
2. Create some test data:
   - Schedule an interview
   - Update an application status
   - Send a message
3. Check the inbox badge shows the correct count
4. Open the inbox and interact with items
5. Verify the badge count decreases as items are viewed

## Future Enhancements

Potential improvements:
- Add `is_viewed` tracking for interviews
- Group messages by conversation thread
- Add "Mark all as read" functionality
- Show unread indicator on individual inbox items
- Add notification preferences
