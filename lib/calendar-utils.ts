import {
  format,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  isBefore,
  isAfter,
  parseISO,
  isSameDay,
} from "date-fns";
import type { Expense, Chore } from "@/lib/types/database";

// Type for a single dot on the calendar
type DotMarking = {
  key: string;
  color: string;
};

// Type for a single date entry in markedDates
type MarkedDateEntry = {
  dots: DotMarking[];
  selected?: boolean;
  selectedColor?: string;
};

// The full MarkedDates map keyed by date string
export type MarkedDates = Record<string, MarkedDateEntry>;

// Event displayed in day detail list
export type CalendarEvent = {
  id: string;
  type: "expense" | "chore";
  title: string;
  detail: string;
  icon: string;
  color: string;
  deepLink: string;
};

const EXPENSE_DOT: DotMarking = { key: "expense", color: "#3b82f6" };
const CHORE_DOT: DotMarking = { key: "chore", color: "#22c55e" };

/**
 * Project chore due dates within a month range based on frequency.
 * Walks both forward and backward from next_due_at to cover the full month.
 */
function projectChoreDates(chore: Chore, monthDate: Date): string[] {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const anchor = parseISO(chore.next_due_at);
  const dates: string[] = [];

  const step = (dir: "forward" | "backward") => {
    let current = anchor;
    // For backward, take one step back before entering the loop
    if (dir === "backward") {
      current = stepDate(current, chore, "backward");
    }

    const limit = 200; // safety cap
    for (let i = 0; i < limit; i++) {
      if (dir === "forward" && isAfter(current, monthEnd)) break;
      if (dir === "backward" && isBefore(current, monthStart)) break;

      if (
        !isBefore(current, monthStart) &&
        !isAfter(current, monthEnd)
      ) {
        const key = format(current, "yyyy-MM-dd");
        if (!dates.includes(key)) {
          dates.push(key);
        }
      }

      current = stepDate(current, chore, dir);
    }
  };

  step("forward");
  step("backward");

  return dates;
}

function stepDate(
  current: Date,
  chore: Chore,
  dir: "forward" | "backward"
): Date {
  const freq = chore.frequency;
  const intervalDays = chore.custom_interval_days ?? 7;

  if (dir === "forward") {
    switch (freq) {
      case "daily":
        return addDays(current, 1);
      case "weekly":
        return addWeeks(current, 1);
      case "monthly":
        return addMonths(current, 1);
      case "custom":
        return addDays(current, intervalDays);
      default:
        return addDays(current, 7);
    }
  } else {
    switch (freq) {
      case "daily":
        return subDays(current, 1);
      case "weekly":
        return subWeeks(current, 1);
      case "monthly":
        return subMonths(current, 1);
      case "custom":
        return subDays(current, intervalDays);
      default:
        return subDays(current, 7);
    }
  }
}

/**
 * Build markedDates object for react-native-calendars (multi-dot marking).
 * Blue dots for expenses, green dots for chores.
 */
export function buildMarkedDates(
  expenses: Expense[],
  chores: Chore[],
  monthDate: Date
): MarkedDates {
  const marked: MarkedDates = {};

  const ensureEntry = (dateKey: string): MarkedDateEntry => {
    if (!marked[dateKey]) {
      marked[dateKey] = { dots: [] };
    }
    return marked[dateKey];
  };

  const addDot = (dateKey: string, dot: DotMarking) => {
    const entry = ensureEntry(dateKey);
    if (!entry.dots.some((d) => d.key === dot.key)) {
      entry.dots.push(dot);
    }
  };

  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  // Add expense dots
  for (const expense of expenses) {
    const expenseDate = parseISO(expense.created_at);
    if (!isBefore(expenseDate, monthStart) && !isAfter(expenseDate, monthEnd)) {
      const dateKey = format(expenseDate, "yyyy-MM-dd");
      addDot(dateKey, EXPENSE_DOT);
    }
  }

  // Add chore dots from projected dates
  for (const chore of chores) {
    const projected = projectChoreDates(chore, monthDate);
    for (const dateKey of projected) {
      addDot(dateKey, CHORE_DOT);
    }
  }

  return marked;
}

/**
 * Get events for a specific date. Returns expense and chore events
 * that fall on the given date string (yyyy-MM-dd).
 */
export function getEventsForDate(
  date: string,
  expenses: Expense[],
  chores: Chore[]
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const targetDate = parseISO(date);

  // Match expenses by created_at date
  for (const expense of expenses) {
    const expenseDate = format(parseISO(expense.created_at), "yyyy-MM-dd");
    if (expenseDate === date) {
      events.push({
        id: expense.id,
        type: "expense",
        title: expense.description,
        detail: `$${Number(expense.amount).toFixed(2)}`,
        icon: "wallet",
        color: "#3b82f6",
        deepLink: `/(app)/expenses/${expense.id}`,
      });
    }
  }

  // Match chores by projected due dates
  for (const chore of chores) {
    // Use the targetDate's month for projection context
    const projected = projectChoreDates(chore, targetDate);
    if (projected.includes(date)) {
      events.push({
        id: chore.id,
        type: "chore",
        title: chore.name,
        detail: chore.current_assignee ? "Assigned" : "Unassigned",
        icon: "checkbox",
        color: "#22c55e",
        deepLink: "/(app)/chores",
      });
    }
  }

  return events;
}
