# CodeVault: Future Implementation Tasks

This document outlines the detailed technical roadmap for the future development of CodeVault. Following this roadmap will transition the project from a working prototype into a robust, scalable, and secure production application.

## Phase 1: The Browser Extension (Top Priority)
**Goal:** Establish a secure, zero-friction method to extract accepted code submissions from platforms without requiring users to hand over their highly sensitive session cookies.

**Tasks:**
- [ ] Initialize a new `browser-extension` workspace (React + Chrome Manifest V3).
- [ ] **Content Scripts:** Write platform-specific content scripts for LeetCode, Codeforces, CodeChef, and HackerRank that inject into the DOM.
- [ ] **Submission Interception:** Listen for the "Submit" button click and monitor the network requests for an "Accepted" verdict.
- [ ] **Code Extraction:** Upon acceptance, securely scrape the source code, problem title, and language directly from the DOM/network response.
- [ ] **Backend Sync:** Authenticate the extension with the CodeVault API (using JWT) and securely POST the extracted solution to the backend.

## Phase 2: The `git-service` Queue Engine
**Goal:** Safely synchronize thousands of code files to GitHub without triggering abuse rate limits.

**Tasks:**
- [ ] Set up a message queue system (e.g., Redis with BullMQ) in the backend.
- [ ] Create the `git-service` worker application.
- [ ] When the backend receives a new solution from the browser extension, add a "sync task" to the queue rather than pushing immediately.
- [ ] Configure the `git-service` to process the queue at a safe rate (e.g., 1 file every 2 seconds).
- [ ] Handle GitHub API failures, retries, and token expirations gracefully.

## Phase 3: Public Portfolios (`/u/[username]`)
**Goal:** Create the viral growth engine for CodeVault by allowing users to share their aggregated stats with the world.

**Tasks:**
- [ ] Build the public routing in Next.js (`app/(public)/u/[username]/page.tsx`).
- [ ] Create a new backend API endpoint `GET /api/public-profile/:username` that fetches a user's stats without requiring authentication.
- [ ] Design the public page to be a slightly modified version of the private Dashboard, emphasizing the Heatmap, Topic Strengths, and Codeforces Rating.
- [ ] Implement OpenGraph metadata (SEO tags) so that sharing the link on Twitter/LinkedIn generates a beautiful preview card.

## Phase 4: Automated Cron Jobs & Notifications
**Goal:** Keep user data fresh and inform them of sync statuses.

**Tasks:**
- [ ] Implement a cron scheduler (e.g., node-cron).
- [ ] Schedule a daily background job to refresh the LeetCode and Codeforces public stats for all active users (to keep their Heatmaps up to date even if they don't submit new code).
- [ ] Build the Notifications panel UI.
- [ ] Trigger notifications when a GitHub sync fails (e.g., "Your GitHub token expired, please re-authenticate").
