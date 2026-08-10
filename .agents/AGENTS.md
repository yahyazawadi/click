# Project Agent Rules

1. **Protect Visual & Feature Quality**: Be extremely careful not to break or remove working features, shaders, or visual design elements ("cool shit") during optimizations or changes.
2. **Strict Merge Control**: Commit progress to working feature branches, but **NEVER** merge into `main` or push to `main` without explicit confirmation and instruction from the user.
3. **Frequent Checkpoint Commits**: Make frequent local git commits to save incremental progress and establish clean checkpoints before attempting major changes or refactors.
