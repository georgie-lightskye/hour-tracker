/**
 * Seed script: pushes your pre-recorded historical entries into Firestore.
 *
 * Run with: pnpm tsx scripts/seed-data.ts
 *
 * IMPORTANT: Before running this script:
 * 1. Create two Firebase Auth users in the Firebase Console
 * 2. Replace DEVELOPER_UID and MANAGER_UID below with their actual UIDs
 * 3. Ensure .env.local has the correct Firebase Admin credentials
 */

import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Load .env.local manually to avoid dotenv dependency
const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex).trim();
  let value = trimmed.slice(eqIndex + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

const app = initializeApp({
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore(app);

// =============================================
// REPLACE THESE WITH YOUR ACTUAL FIREBASE AUTH UIDs
// =============================================
const DEVELOPER_UID = "9b9qqUlwrUYdYqi9UwFRTRrSWq22";
const MANAGER_UID = "nTFgSRRLu3hGbm2E6cF0MturyV83";

async function seed() {
  console.log("Starting seed...\n");

  // 1. Create user documents

  // 2. Seed historical entries
  console.log("Creating historical entries...");

  // --- Entry 1: March 6, 2026 (7pm - 2am) ---
  const entry1Ref = db.collection("entries").doc();
  const entry1CheckIn = new Date("2026-03-06T19:00:00");
  const entry1CheckOut = new Date("2026-03-07T02:00:00");
  // No explicit breaks in the log, but work started at 9:45pm
  // 7pm to 9:45pm was revisiting (2h45m active), then 9:45pm to 2am working (4h15m)
  // Total: 7h, Active: 7h, all billable
  await entry1Ref.set({
    userId: DEVELOPER_UID,
    date: Timestamp.fromDate(new Date("2026-03-06")),
    checkIn: Timestamp.fromDate(entry1CheckIn),
    checkOut: Timestamp.fromDate(entry1CheckOut),
    breaks: [],
    tasks: [
      {
        description: "Revisited the website",
        category: "#website-updates",
        subtasks: [],
        billable: true,
        hours: 1,
      },
      {
        description: "Received instructions for the website and started working",
        category: "#website-updates",
        subtasks: [],
        billable: true,
        hours: 0.75,
      },
      {
        description: "Media extraction from main website",
        category: "#website-updates",
        subtasks: [],
        billable: true,
        hours: 3,
      },
      {
        description: "Added video just below the hero section",
        category: "#website-updates",
        subtasks: [],
        billable: true,
        hours: 1.25,
      },
      {
        description: "Added gallery",
        category: "#website-updates",
        subtasks: [],
        billable: true,
        hours: 1,
      },
    ],
    resources: [
      "https://www.loom.com/share/decae20274324e7cbf86b373b3442b81",
      "https://sites.google.com/lightskye.com/knowledgebase/lightskye-equipment",
    ],
    notes:
      "Blog update plan: create a backend for the website where user can login and add or remove blogs",
    totalHours: 7,
    activeHours: 7,
    billableHours: 7,
    status: "completed",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  console.log("  Entry 1 (Mar 6): 7pm - 2am, 7h active");

  // --- Entry 2: March 7, 2026 (10:30am - ongoing, break 12pm-1:15pm) ---
  const entry2Ref = db.collection("entries").doc();
  const entry2CheckIn = new Date("2026-03-07T10:30:00");
  const entry2CheckOut = new Date("2026-03-07T17:00:00"); // Assume 5pm checkout for now
  const entry2BreakStart = new Date("2026-03-07T12:00:00");
  const entry2BreakEnd = new Date("2026-03-07T13:15:00");
  // Total: 6.5h, Break: 1.25h, Active: 5.25h
  await entry2Ref.set({
    userId: DEVELOPER_UID,
    date: Timestamp.fromDate(new Date("2026-03-07")),
    checkIn: Timestamp.fromDate(entry2CheckIn),
    checkOut: Timestamp.fromDate(entry2CheckOut),
    breaks: [
      {
        start: Timestamp.fromDate(entry2BreakStart),
        end: Timestamp.fromDate(entry2BreakEnd),
      },
    ],
    tasks: [
      {
        description: "Updated about-us page",
        category: "#website-updates",
        subtasks: [],
        billable: true,
        hours: 1,
      },
      {
        description: "Updated terms of services & privacy policy",
        category: "#website-updates",
        subtasks: [],
        billable: true,
        hours: 0.75,
      },
      {
        description: "Fixed navigation bar issue in survey",
        category: "#website-updates",
        subtasks: [],
        billable: true,
        hours: 1,
      },
      {
        description: "Added gallery pop-up for portfolio",
        category: "#website-updates",
        subtasks: [],
        billable: true,
        hours: 1,
      },
      {
        description: "Hour tracker project",
        category: "#hour-tracker",
        subtasks: [],
        billable: true,
        hours: 1.5,
      },
    ],
    resources: [],
    notes: "",
    totalHours: 6.5,
    activeHours: 5.25,
    billableHours: 5.25,
    status: "completed",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  console.log("  Entry 2 (Mar 7): 10:30am - 5pm, 5.25h active (1.25h break)");

  console.log("\nSeed complete! Created 2 entries.");
  console.log(
    "\nReminder: Update DEVELOPER_UID and MANAGER_UID in this script with your actual Firebase Auth UIDs.",
  );
}

seed().catch(console.error);
