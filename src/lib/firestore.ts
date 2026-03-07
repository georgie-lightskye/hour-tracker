import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Entry, Comment, TimerState, Break, DateRange, Task } from "./types";

// --- Timestamp converters ---

function toDate(ts: Timestamp | Date | null): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  return ts;
}

function toTimestamp(date: Date | null): Timestamp | null {
  if (!date) return null;
  return Timestamp.fromDate(date);
}

function breaksToFirestore(breaks: Break[]) {
  return breaks.map((b) => ({
    start: Timestamp.fromDate(b.start),
    end: b.end ? Timestamp.fromDate(b.end) : null,
  }));
}

function breaksFromFirestore(breaks: { start: Timestamp; end: Timestamp | null }[]): Break[] {
  return (breaks || []).map((b) => ({
    start: b.start.toDate(),
    end: b.end ? b.end.toDate() : null,
  }));
}

function entryFromFirestore(id: string, data: Record<string, unknown>): Entry {
  return {
    id,
    userId: data.userId as string,
    date: (data.date as Timestamp).toDate(),
    checkIn: (data.checkIn as Timestamp).toDate(),
    checkOut: toDate(data.checkOut as Timestamp | null),
    breaks: breaksFromFirestore(data.breaks as { start: Timestamp; end: Timestamp | null }[] || []),
    tasks: (data.tasks as Task[]) || [],
    resources: (data.resources as string[]) || [],
    notes: (data.notes as string) || "",
    totalHours: (data.totalHours as number) || 0,
    activeHours: (data.activeHours as number) || 0,
    billableHours: (data.billableHours as number) || 0,
    status: (data.status as Entry["status"]) || "completed",
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
  };
}

// --- Entries ---

export async function createEntry(
  data: Omit<Entry, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, "entries"), {
    ...data,
    date: Timestamp.fromDate(data.date),
    checkIn: Timestamp.fromDate(data.checkIn),
    checkOut: data.checkOut ? Timestamp.fromDate(data.checkOut) : null,
    breaks: breaksToFirestore(data.breaks),
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateEntry(
  id: string,
  data: Partial<Entry>
): Promise<void> {
  const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };

  if (data.date) updateData.date = Timestamp.fromDate(data.date);
  if (data.checkIn) updateData.checkIn = Timestamp.fromDate(data.checkIn);
  if (data.checkOut !== undefined) updateData.checkOut = toTimestamp(data.checkOut);
  if (data.breaks) updateData.breaks = breaksToFirestore(data.breaks);
  if (data.tasks) updateData.tasks = data.tasks;
  if (data.resources) updateData.resources = data.resources;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.totalHours !== undefined) updateData.totalHours = data.totalHours;
  if (data.activeHours !== undefined) updateData.activeHours = data.activeHours;
  if (data.billableHours !== undefined) updateData.billableHours = data.billableHours;
  if (data.status) updateData.status = data.status;

  await updateDoc(doc(db, "entries", id), updateData);
}

export async function getEntry(id: string): Promise<Entry | null> {
  const snap = await getDoc(doc(db, "entries", id));
  if (!snap.exists()) return null;
  return entryFromFirestore(snap.id, snap.data());
}

export async function getEntriesByUser(
  userId: string,
  dateRange?: DateRange
): Promise<Entry[]> {
  let q = query(
    collection(db, "entries"),
    where("userId", "==", userId),
    orderBy("date", "desc")
  );

  if (dateRange) {
    q = query(
      collection(db, "entries"),
      where("userId", "==", userId),
      where("date", ">=", Timestamp.fromDate(dateRange.start)),
      where("date", "<=", Timestamp.fromDate(dateRange.end)),
      orderBy("date", "desc")
    );
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => entryFromFirestore(d.id, d.data()));
}

export async function getAllEntries(dateRange?: DateRange): Promise<Entry[]> {
  let q = query(collection(db, "entries"), orderBy("date", "desc"));

  if (dateRange) {
    q = query(
      collection(db, "entries"),
      where("date", ">=", Timestamp.fromDate(dateRange.start)),
      where("date", "<=", Timestamp.fromDate(dateRange.end)),
      orderBy("date", "desc")
    );
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => entryFromFirestore(d.id, d.data()));
}

export async function deleteEntry(id: string): Promise<void> {
  await deleteDoc(doc(db, "entries", id));
}

// --- Manager actions ---

export async function toggleTaskBillable(
  entryId: string,
  taskIndex: number,
  billable: boolean
): Promise<void> {
  const entry = await getEntry(entryId);
  if (!entry) return;
  const tasks = [...entry.tasks];
  tasks[taskIndex] = { ...tasks[taskIndex], billable };
  const totalTaskHours = tasks.reduce((sum, t) => sum + (t.hours || 0), 0);
  let billableHours: number;
  if (totalTaskHours === 0) {
    const billableCount = tasks.filter((t) => t.billable).length;
    billableHours = tasks.length > 0 ? entry.activeHours * (billableCount / tasks.length) : 0;
  } else {
    billableHours = tasks.reduce((sum, t) => (t.billable ? sum + (t.hours || 0) : sum), 0);
  }
  await updateDoc(doc(db, "entries", entryId), {
    tasks,
    billableHours,
    updatedAt: Timestamp.now(),
  });
}

export async function flagTask(
  entryId: string,
  taskIndex: number,
  flagged: boolean
): Promise<void> {
  const entry = await getEntry(entryId);
  if (!entry) return;
  const tasks = [...entry.tasks];
  tasks[taskIndex] = { ...tasks[taskIndex], flagged };
  await updateDoc(doc(db, "entries", entryId), {
    tasks,
    updatedAt: Timestamp.now(),
  });
}

// --- Comments ---

export async function addComment(
  entryId: string,
  comment: Omit<Comment, "id" | "createdAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, "entries", entryId, "comments"), {
    ...comment,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getComments(entryId: string): Promise<Comment[]> {
  const q = query(
    collection(db, "entries", entryId, "comments"),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      userName: data.userName,
      text: data.text,
      createdAt: (data.createdAt as Timestamp).toDate(),
    };
  });
}

export function subscribeToComments(
  entryId: string,
  callback: (comments: Comment[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "entries", entryId, "comments"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    const comments = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId,
        userName: data.userName,
        text: data.text,
        createdAt: (data.createdAt as Timestamp).toDate(),
      };
    });
    callback(comments);
  });
}

// --- Timer ---

export async function getTimerState(userId: string): Promise<TimerState | null> {
  const snap = await getDoc(doc(db, "timers", userId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    isRunning: data.isRunning,
    checkInTime: toDate(data.checkInTime as Timestamp | null),
    breaks: breaksFromFirestore(data.breaks || []),
    currentEntryId: data.currentEntryId || null,
  };
}

export async function setTimerState(
  userId: string,
  state: TimerState
): Promise<void> {
  await setDoc(doc(db, "timers", userId), {
    isRunning: state.isRunning,
    checkInTime: state.checkInTime ? Timestamp.fromDate(state.checkInTime) : null,
    breaks: breaksToFirestore(state.breaks),
    currentEntryId: state.currentEntryId,
  });
}

export async function clearTimerState(userId: string): Promise<void> {
  await setDoc(doc(db, "timers", userId), {
    isRunning: false,
    checkInTime: null,
    breaks: [],
    currentEntryId: null,
  });
}

// --- Resume entry ---

export async function resumeEntry(
  userId: string,
  entryId: string
): Promise<TimerState | null> {
  const entry = await getEntry(entryId);
  if (!entry || entry.userId !== userId) return null;

  const now = new Date();

  // Reopen entry: clear checkOut, set in-progress
  await updateDoc(doc(db, "entries", entryId), {
    checkOut: null,
    status: "in-progress",
    totalHours: 0,
    activeHours: 0,
    billableHours: 0,
    updatedAt: Timestamp.now(),
  });

  // Set timer to resume from original checkIn with all previous breaks
  // plus add a "gap break" from old checkOut to now (time you weren't working)
  const breaks = [...entry.breaks];
  if (entry.checkOut) {
    breaks.push({ start: entry.checkOut, end: now });
  }

  const state: TimerState = {
    isRunning: true,
    checkInTime: entry.checkIn,
    breaks,
    currentEntryId: entryId,
  };

  await setTimerState(userId, state);
  return state;
}
