# Queue

## 2026-03-15 — M002: Smart Groceries

Overhaul grocery feature with three new capabilities: receipt scanning (Gemini Vision OCR → itemized cost splitting), recipe URL import (YouTube/TikTok/Instagram → ingredient extraction → grocery list), and store product integration (Instacart API → real products with aisle/department info). All backend processing via Supabase Edge Functions. Depends on M001.

## 2026-03-15 — M003: Chore System Overhaul

Complete redesign of chore feature from flat checklist to room-based, effort-weighted, gamified household management. Key features: room organization (shared + private rooms), effort points (1-3) with fairness analytics, smart "My Day" daily task list, pre-built room templates, visual urgency indicators (green/yellow/red), peer nudging via push notification, weekly effort leaderboard, streak badges. Build everything free for beta validation — monetization gating deferred to App Store publish. Depends on M002.
