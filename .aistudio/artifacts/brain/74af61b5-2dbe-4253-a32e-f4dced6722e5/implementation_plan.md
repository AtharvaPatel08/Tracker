# Implementation Plan: Complete Database Reset & Fresh Start

Reset the application's database, clear all stored Firestore documents, remove sample demo entries, and configure clean-slate empty states across the application.

## 1. Database Identification & Target Scope

- **Active Database**: Google Cloud Firestore (Project ID: `shat-94ca2`)
- **Target Collections & Subcollections**:
  - `users`: User profiles, body metrics, goal configurations, and onboarding flags
  - `users/{userId}/meals`: Logged nutrition and daily meal entries
  - `users/{userId}/checkins`: Daily check-in tracking records (sleep, workout, water, energy, pain)
  - `workoutSplits`: User custom workout routines, split definitions, and exercise selections
  - `chatUsage`: AI coach interaction counters and rate-limit logs

## 2. Deletion & Reset Execution

- Create and run an administrative cleanup script (`scripts/reset-database.ts`) connecting to Firestore.
- Iteratively query and delete all documents in `users`, `workoutSplits`, and `chatUsage`.
- Recursively delete subcollections (`users/{userId}/meals` and `users/{userId}/checkins`).
- Clear active client authentication session data and local storage tokens.
- Execute a verification query to guarantee all target collections have 0 documents remaining.

## 3. Clear Seed Data & Default State Repopulation

- **`src/components/Dashboard.tsx`**:
  - Replace hardcoded sample meal (`4 Egg Whites + 2 Whole Eggs...`) with an empty array `[]`.
  - Set initial streak state to `0` (previously defaulted to `3`).
  - Set initial water intake counter to `0` (previously defaulted to `5`).
  - Ensure zero excuse workout history starts clean.
- **`src/components/WorkoutSplit.jsx`**:
  - Replace auto-injection of sample PPL exercises with a clean empty split state requiring user creation.
- **`src/App.tsx`**:
  - Ensure guest bypass and login flows start from a pristine uninitialized profile state rather than pre-populating dummy workout and meal logs.

## 4. Verification & Validation

- Run automated query checks on Firestore confirming collections return empty arrays.
- Execute `lint_applet` (`tsc --noEmit`) and `compile_applet` (`npm run build`).
- Verify that the application boots cleanly to the landing page and dashboard displays genuine empty states with zero pre-existing records.
