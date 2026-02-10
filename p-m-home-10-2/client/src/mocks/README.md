# Mock system (Phase 1)

The app uses a **mock data layer** until a real backend is connected.

- **Seed**: `src/data/seed/demoSeed.js` generates demo users, projects, tasks, and notifications. Dates are built from "today" so behaviour stays consistent.
- **Storage**: `src/data/storage/storage.js` persists data in `localStorage` with keys from `storageKeys.js`. On first load, if no data exists, storage is auto-seeded.
- **Repositories**: `src/data/repositories/*` are the single source of truth. All reads/writes go through them; business rules (permissions, project status, task assignment) are enforced there. The UI must not bypass repos.
- **Store**: `src/store/dataStore.js` exposes the current dataset and actions (reset, refresh, CRUD wrappers) so components don’t hit localStorage directly.

**Replacing with an API**: Swap the repository implementations to call your API instead of storage. Keep the same function signatures and return shapes so the store and UI can stay unchanged.
