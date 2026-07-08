---
name: Expo web e2e testing quirks
description: How to run Playwright e2e tests against the Expo web dev server without false failures
---

# Expo web e2e testing quirks

- The Expo dev server bundles lazily. First navigation often shows a blank page **or** expo-router's default "404 Page Not Found / Did you forget to add the page to the router?" screen while the bundle builds. Test plans must say: wait ~15s and reload (several times) until the real screen appears — otherwise the testing agent reports a bogus 404 failure.
- **Why:** A first e2e run failed on a transient 404 even though the route rendered fine in a direct screenshot; a rerun with explicit reload instructions passed.
- **How to apply:** In any `runTest` plan targeting the Expo web app, include the reload-through-404/blank instruction and use the `$REPLIT_EXPO_DEV_DOMAIN` URL directly (Expo bypasses the shared proxy).
- Programmatic login on Expo web: the mobile auth context stores the bearer token in `localStorage` under `session_token` on web (SecureStore on native). Register a user via the API, set that key, reload — no UI login needed.
- React Native Web renders `testID` as `data-testid`, so testIDs work as Playwright selectors.
