# Implementation Plan - Header Menu Refactor

## Goal
Clean up the app header by consolidating individual actions (Receipt, Profile, Refresh) into a single **Menu Dropdown**.

## User Requirements
- **Menu Icon**: Use "Hamburger" (`☰`) or "Kebab" (`⋮`) icon.
- **Logged In State**:
    -   User Profile (Avatar + Name).
    -   Receipt Manager.
    -   Refresh Rates.
    -   App Info.
    -   Logout.
- **Logged Out State**:
    -   Login Button.
    -   Refresh Rates.
    -   App Info.

## Proposed Changes

### 1. `index.html`
-   Remove: `#receiptManagerBtn`, `#userProfile`, `#refreshRateBtn`, `#signOutBtn`.
-   Add:
    -   `#mainMenuBtn` (The trigger).
    -   `#mainMenuDropdown` (The container).
    -   List items for each action.
    -   Container for Google Sign-In button inside the menu (or a placeholder).

### 2. `styles.css`
-   Style `.header-menu-btn`: Clean icon button.
-   Style `.menu-dropdown`: Absolute positioned, card style, shadow, z-index.
-   Style `.menu-item`: Touch-friendly padding, flex layout.
-   Style `.menu-user-profile`: Special styling for the top item in logged-in state.

### 3. `app.js`
-   **Toggle Logic**: Click menu button -> Show/Hide dropdown. Click outside -> Hide.
-   **Dynamic Rendering**:
    -   `updateMenuState(isLoggedIn)` function.
    -   If Logged In: Show Profile, Receipt, Logout sections. Hide Login section.
    -   If Logged Out: Show Login section. Hide Profile, Receipt, Logout.
-   **Event Listeners**: Re-bind click events for Refresh, Receipt, Logout to the new menu items.

## Verification
-   Check layout on Mobile (clean header).
-   Test Login flow (Menu updates automatically).
-   Test Logout flow (Menu reverts).
-   Test all actions (Receipt, Refresh).
