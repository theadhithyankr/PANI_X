# Inbox Unread Indicator - Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                    │
│  │  SideMenu    │         │  Inbox Page  │                    │
│  │              │         │              │                    │
│  │  Inbox [5]   │◄────────┤  • Messages  │                    │
│  │              │         │  • Apps      │                    │
│  └──────────────┘         │  • Interviews│                    │
│         │                 └──────────────┘                    │
│         │                        │                             │
│         │                        │                             │
└─────────┼────────────────────────┼─────────────────────────────┘
          │                        │
          │                        │
          ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      React Hooks Layer                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  useInbox()                                            │   │
│  │  ┌──────────────────────────────────────────────────┐ │   │
│  │  │ • Fetches inbox items                            │ │   │
│  │  │ • Counts unread items:                           │ │   │
│  │  │   - Scheduled interviews (always unread)         │ │   │
│  │  │   - Applications (is_viewed = false)             │ │   │
│  │  │   - Messages (is_read = false)                   │ │   │
│  │  │ • Returns: inboxItems, unreadCount               │ │   │
│  │  │ • Provides: markApplicationAsViewed()            │ │   │
│  │  └──────────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  useMessages()                                         │   │
│  │  ┌──────────────────────────────────────────────────┐ │   │
│  │  │ • Fetches messages between two users             │ │   │
│  │  │ • Auto-marks messages as read on fetch           │ │   │
│  │  │ • Returns: messages, loading                     │ │   │
│  │  │ • Provides: sendMessage(), markMessagesAsRead()  │ │   │
│  │  └──────────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
          │                        │
          │                        │
          ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Database                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ interviews   │  │ applications │  │  messages    │         │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤         │
│  │ id           │  │ id           │  │ id           │         │
│  │ status       │  │ status       │  │ content      │         │
│  │ start_time   │  │ is_viewed ✨ │  │ is_read      │         │
│  │ ...          │  │ ...          │  │ ...          │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ✨ = New column added by migration                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
          │                        │
          │   Real-time Updates    │
          └────────────────────────┘
```

## User Interaction Flows

### Flow 1: Opening a Chat (Marks Messages as Read)

```
User                    UI                  Hook                Database
 │                      │                    │                    │
 │  Click "Message"     │                    │                    │
 ├─────────────────────>│                    │                    │
 │                      │                    │                    │
 │                      │  fetchMessages()   │                    │
 │                      ├───────────────────>│                    │
 │                      │                    │                    │
 │                      │                    │  SELECT messages   │
 │                      │                    ├───────────────────>│
 │                      │                    │                    │
 │                      │                    │  UPDATE is_read    │
 │                      │                    ├───────────────────>│
 │                      │                    │                    │
 │                      │  messages[]        │                    │
 │                      │<───────────────────┤                    │
 │                      │                    │                    │
 │  See chat messages   │                    │                    │
 │<─────────────────────┤                    │                    │
 │                      │                    │                    │
 │                      │                    │  Real-time event   │
 │                      │                    │<───────────────────┤
 │                      │                    │                    │
 │                      │  fetchInbox()      │                    │
 │                      │<───────────────────┤                    │
 │                      │                    │                    │
 │  Badge count         │                    │                    │
 │  decreases ✨        │                    │                    │
 │<─────────────────────┤                    │                    │
```

### Flow 2: Viewing Application Details (Marks Application as Viewed)

```
User                    UI                  Hook                Database
 │                      │                    │                    │
 │  Click "View Details"│                    │                    │
 ├─────────────────────>│                    │                    │
 │                      │                    │                    │
 │                      │  markApplication   │                    │
 │                      │  AsViewed(id)      │                    │
 │                      ├───────────────────>│                    │
 │                      │                    │                    │
 │                      │                    │  UPDATE is_viewed  │
 │                      │                    ├───────────────────>│
 │                      │                    │                    │
 │                      │  fetchInbox()      │                    │
 │                      │<───────────────────┤                    │
 │                      │                    │                    │
 │  Badge count         │                    │                    │
 │  decreases ✨        │                    │                    │
 │<─────────────────────┤                    │                    │
```

### Flow 3: Receiving New Item (Real-time Update)

```
Sender                Database            Hook                UI                User
 │                      │                  │                  │                  │
 │  Send message        │                  │                  │                  │
 ├─────────────────────>│                  │                  │                  │
 │                      │                  │                  │                  │
 │                      │  Real-time event │                  │                  │
 │                      ├─────────────────>│                  │                  │
 │                      │                  │                  │                  │
 │                      │                  │  fetchInbox()    │                  │
 │                      │                  ├─────────────────>│                  │
 │                      │                  │                  │                  │
 │                      │                  │  SELECT unread   │                  │
 │                      │<─────────────────┤                  │                  │
 │                      │                  │                  │                  │
 │                      │  unreadCount++   │                  │                  │
 │                      │  ────────────────┤                  │                  │
 │                      │                  │                  │                  │
 │                      │                  │  Update badge    │                  │
 │                      │                  ├─────────────────>│                  │
 │                      │                  │                  │                  │
 │                      │                  │                  │  Badge count     │
 │                      │                  │                  │  increases ✨    │
 │                      │                  │                  ├─────────────────>│
```

## Unread Count Calculation

```
┌─────────────────────────────────────────────────────────────┐
│                    Calculate Unread Count                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Initialize unreadCount = 0   │
              └───────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│ Interviews   │      │ Applications │     │  Messages    │
├──────────────┤      ├──────────────┤     ├──────────────┤
│ status =     │      │ is_viewed =  │     │ is_read =    │
│ 'scheduled'  │      │ false        │     │ false        │
└──────────────┘      └──────────────┘     └──────────────┘
        │                     │                     │
        │ Count all           │ Count each          │ Count each
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Total Unread    │
                    │  Count = Sum     │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Display Badge   │
                    │  in SideMenu     │
                    └──────────────────┘
```

## Badge Display Logic

```
unreadCount = 0     →  No badge shown
                       Inbox

unreadCount = 1-99  →  Show number
                       Inbox [5]

unreadCount ≥ 100   →  Show "99+"
                       Inbox [99+]
```

## Real-time Subscription Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Component Mounts                         │
│                    (useInbox hook)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Subscribe to Supabase        │
              │  Real-time Channels:          │
              │  • interviews table           │
              │  • applications table         │
              │  • messages table             │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Listen for changes:          │
              │  • INSERT                     │
              │  • UPDATE                     │
              │  • DELETE                     │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  On any change:               │
              │  fetchInbox()                 │
              │  → Recalculate unreadCount    │
              │  → Update UI                  │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Component Unmounts           │
              │  → Unsubscribe from channels  │
              └───────────────────────────────┘
```

## Data Flow Summary

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Database │────>│   Hook   │────>│    UI    │────>│   User   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     ▲                                                    │
     │                                                    │
     └────────────────────────────────────────────────────┘
                    User Actions
           (mark as read, mark as viewed)
```

## Key Points

1. **Automatic Updates**: Badge updates automatically via real-time subscriptions
2. **No Manual Refresh**: Users don't need to refresh the page
3. **Efficient Queries**: Database index ensures fast unread count queries
4. **Backward Compatible**: Old data works fine (defaults to unread)
5. **Cross-Tab Sync**: Works across multiple browser tabs/windows

## Performance Characteristics

- **Initial Load**: Single query to fetch all inbox items + count
- **Mark as Read**: Single UPDATE query
- **Real-time**: Minimal overhead, reuses existing subscriptions
- **Index**: Partial index keeps size small (only unread items)
- **Network**: No polling, uses WebSocket for real-time updates
