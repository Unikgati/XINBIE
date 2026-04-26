# DapurGizi Project Rules

## UI/UX Rules
- **Confirmation Dialogs**: Always use `showModalBottomSheet` instead of standard `AlertDialog` or `showDialog` for user confirmation (e.g., cancelling an order, deleting an item). This ensures a consistent, modern mobile UX. Bottom sheets should have rounded top corners (`BorderRadius.vertical(top: Radius.circular(24))`), a grab handle indicator at the top, and side-by-side action buttons.
- **Sticky Footers**: All sticky footers (using `bottomNavigationBar`) should have rounded top corners using `BorderRadius.vertical(top: Radius.circular(24))` and a subtle drop shadow to maintain consistency across the app.
