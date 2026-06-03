export interface PreloadedTicket {
  id: string;
  title: string;
  body: string;
}

export const POWER_PORTAL_TICKETS: PreloadedTicket[] = [
  {
    id: "intro-screen",
    title: "Intro screen",
    body: `## User Story
As a field worker, I want to see a branded splash screen on app launch, so that I feel confident I've opened the correct KIT application.

## Description
The intro screen is the first thing a user sees when opening the Power Portal app. It displays the KIT brand identity and a single Continue CTA that transitions the user to the Landing Page.

## Assumptions
- Displayed only on first launch or when session is expired
- Animation / transition to landing page should be smooth and fast (< 500ms)

## Acceptance Criteria
- **Given** the app launches for the first time or after session expiry
- **When** the intro screen renders
- **Then** the KIT logo, wordmark, and Continue button are visible
- **When** the user taps Continue
- **Then** they are navigated to the Landing Page

## Requirements
- KIT logo centred on screen
- Brand background colour applied
- Single "Continue" primary CTA button
- No navigation chrome on this screen

## Design
[Figma — Power Portal / Intro Screen]

## Implementation
Open to dev team.`,
  },
  {
    id: "landing-page",
    title: "Landing page",
    body: `## User Story
As a field worker, I want a clear home screen that shows my active work and lets me start a new job, so that I can get to the right task quickly.

## Description
The landing page is the primary home screen for logged-in users. It greets them by name, surfaces the Start JSA primary action, and shows any work they have in progress so they can resume without searching.

## Assumptions
- User is authenticated before reaching this screen
- "Continue work" section is hidden if no in-progress items exist
- Greeting adapts to time of day (Morning / Afternoon / Evening)

## Acceptance Criteria
- **Given** the user is logged in and on the landing page
- **When** the page loads
- **Then** a greeting with their name, a Start JSA card, and a Continue Work section are visible
- **When** there are no in-progress items
- **Then** the Continue Work section is not rendered

## Requirements
- Time-sensitive greeting (Good morning / afternoon / evening, [Name])
- Start JSA card — prominent, primary colour background
- Continue Work section — list of in-progress jobs with status chips
- Bottom tab navigation present

## Design
[Figma — Power Portal / Landing Page]

## Implementation
Greeting and in-progress data fetched from the same /dashboard endpoint. Cache with a 60-second SWR strategy.`,
  },
  {
    id: "apps-kit-ecosystem",
    title: "Apps — KIT ecosystem workspace",
    body: `## User Story
As a field worker, I want to see all KIT apps in one place, so that I can quickly switch to the tool I need without leaving the Power Portal.

## Description
A bottom drawer panel that slides up over the current screen, displaying a grid of all available KIT app tiles. Each tile shows the app icon, name, and a launch arrow. Tapping a tile deep-links into that app or opens it in a web view.

## Assumptions
- App list is data-driven and fetched from a remote config endpoint
- Apps not installed show an install prompt instead of launching
- Drawer dismisses on swipe down or tapping outside

## Acceptance Criteria
- **Given** the user taps the Apps icon in the nav
- **When** the drawer opens
- **Then** all KIT app tiles are shown in a 3-column grid
- **When** the user taps a tile
- **Then** the relevant app launches or an install prompt appears
- **When** the user swipes down or taps outside the drawer
- **Then** the drawer closes

## Requirements
- Bottom sheet / drawer component — 50% screen height, draggable
- 3-column icon grid with label beneath each icon
- Data-driven — app list from remote JSON config
- Install state handling (installed vs not installed)

## Design
[Figma — Power Portal / Apps Drawer]

## Implementation
App list endpoint: GET /api/kit-apps. Cache 5 minutes. Use native bottom sheet on iOS/Android; fixed position panel on web.`,
  },
  {
    id: "app-hub-component",
    title: "App hub — reusable component pattern",
    body: `## User Story
As a developer, I want a shared App Hub screen component that all KIT apps can adopt, so that users get a consistent home experience across the entire ecosystem.

## Description
A reusable, data-driven hub screen component that serves as the home screen for any KIT app. It accepts a configuration object (app name, primary colour, navigation items, feature cards) and renders a standardised layout. Individual apps customise via config, not by forking the component.

## Assumptions
- All KIT apps will opt in to this pattern in the next sprint cycle
- Config schema is versioned to allow non-breaking additions
- Dark mode is handled by the shared design token system

## Acceptance Criteria
- **Given** an app provides a valid hub config
- **When** the hub screen mounts
- **Then** it renders the app name, branded header, navigation items, and feature cards correctly
- **When** the config is invalid or missing required fields
- **Then** an error boundary displays a fallback UI and logs to Sentry

## Requirements
- TypeScript interface for hub config (HubConfig)
- Slots: header, primary action, nav grid, feature cards, footer
- Storybook story with multiple config examples
- Unit tests for config validation

## Design
[Figma — KIT Design System / App Hub Pattern]

## Implementation
Publish as a shared component in the @ke-is/kit-ui package. Consuming apps import and configure.`,
  },
  {
    id: "notifications-unread",
    title: "Notifications — unread state",
    body: `## User Story
As a field worker, I want to clearly see which notifications I haven't read yet, so that I don't miss important updates from my team.

## Description
The notifications list screen when the user has one or more unread notifications. Each unread item is distinguished with a blue dot indicator on the left. A "Mark all as read" action appears at the top of the list.

## Assumptions
- Read state is persisted server-side
- Notifications are paginated (20 per page)
- Tapping a notification marks it as read and navigates to the relevant context

## Acceptance Criteria
- **Given** the user has unread notifications
- **When** the notifications screen opens
- **Then** unread items show a filled blue dot on the left
- **When** the user taps a notification
- **Then** the dot disappears and the user is taken to the relevant screen
- **When** the user taps "Mark all as read"
- **Then** all dots disappear and the server is updated

## Requirements
- Blue dot (6px, #185FA5) left of unread notification rows
- "Mark all as read" text button top right
- Notification row: icon, title, body snippet, timestamp
- Optimistic UI — dots disappear immediately, API call in background

## Design
[Figma — Power Portal / Notifications — Unread]

## Implementation
PATCH /notifications/read-all for bulk action. Individual read: PATCH /notifications/:id/read on tap.`,
  },
  {
    id: "notifications-all-read",
    title: "Notifications — all read state",
    body: `## User Story
As a field worker, I want to see my notifications list after reading everything, so that I can review past updates and clear my history.

## Description
The notifications list when all items have been read. No blue dots are shown. A "Clear all" action replaces the "Mark all as read" button, allowing the user to dismiss the full notification history.

## Assumptions
- Cleared notifications are soft-deleted (still retrievable by admin)
- "Clear all" requires a confirmation step (inline, not a full modal)

## Acceptance Criteria
- **Given** all notifications are read
- **When** the notifications screen renders
- **Then** no blue dots are visible on any row
- **When** the user taps "Clear all"
- **Then** an inline confirmation ("Clear all notifications?  Yes / Cancel") appears
- **When** the user confirms
- **Then** the list empties and transitions to the empty state

## Requirements
- No blue dots on any row
- "Clear all" button top right (replaces "Mark all as read")
- Inline confirmation before clearing
- Smooth transition to empty state after clearing

## Design
[Figma — Power Portal / Notifications — All Read]

## Implementation
DELETE /notifications/all. Animate list items out (stagger 30ms each) before showing empty state.`,
  },
  {
    id: "notifications-empty",
    title: "Notifications — empty state",
    body: `## User Story
As a field worker, I want a clear message when I have no notifications, so that I know the app is working and I'm not missing anything.

## Description
The empty state for the notifications screen, displayed when the user has no notifications (either none have been sent yet, or they've cleared all). Shows a bell icon, a friendly headline, and a short explanation.

## Assumptions
- Empty state is shown both for zero-notifications-ever and post-clear scenarios
- No retry or refresh action needed — pull-to-refresh is globally available

## Acceptance Criteria
- **Given** the user has no notifications
- **When** the notifications screen loads
- **Then** a bell icon, "No notifications yet" heading, and explanatory subtext are displayed
- **When** a new notification arrives (push)
- **Then** the list transitions from empty state to the unread state

## Requirements
- Centred illustration / icon (bell, outlined, muted colour)
- Heading: "No notifications yet"
- Subtext: "We'll let you know when something needs your attention."
- No action buttons

## Design
[Figma — Power Portal / Notifications — Empty]

## Implementation
Conditional render based on notifications.length === 0. Illustration is an inline SVG from the design system.`,
  },
  {
    id: "profile",
    title: "Profile",
    body: `## User Story
As a field worker, I want to view my profile details and sign out, so that I can confirm my identity and securely end my session on shared devices.

## Description
The profile screen displays the authenticated user's avatar (initials fallback), full name, role, and company. A Sign Out button at the bottom ends the session and returns the user to the intro screen.

## Assumptions
- Profile data is sourced from the auth token / user object, not a separate API call
- Avatar is fetched from the user's profile image URL; falls back to coloured initials
- Sign out clears all local state and tokens

## Acceptance Criteria
- **Given** the user navigates to their profile
- **When** the screen loads
- **Then** their avatar, name, role, and company are displayed
- **When** the user taps "Sign out"
- **Then** session tokens are cleared and the user is taken to the Intro Screen
- **When** no profile image is available
- **Then** initials in a coloured circle are shown instead

## Requirements
- Avatar: 80px circle, image or initials fallback
- Display name, role, company in a stacked layout
- "Sign out" button — outlined, destructive colour (#ef4444)
- No edit profile functionality in this version

## Design
[Figma — Power Portal / Profile]

## Implementation
Call auth.signOut() which clears AsyncStorage tokens. Navigate to /intro with reset stack so back button is not available.`,
  },
];
