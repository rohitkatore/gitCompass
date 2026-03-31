/**
 * Date utility helpers used across GitCompass UI.
 * Provides human-readable relative times and formatted date strings
 * consistent with how GitHub displays repository activity.
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * Returns a human-readable relative time string, e.g. "3 days ago", "just now".
 * @param {string|Date|number} date - ISO string, Date object, or timestamp
 * @returns {string}
 */
export function timeAgo(date) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;

  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) {
    const mins = Math.floor(diff / MINUTE);
    return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  if (diff < WEEK) {
    const days = Math.floor(diff / DAY);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
  if (diff < MONTH) {
    const weeks = Math.floor(diff / WEEK);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }
  if (diff < YEAR) {
    const months = Math.floor(diff / MONTH);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }
  const years = Math.floor(diff / YEAR);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

/**
 * Formats a date as "Jan 5, 2025" — used for PR and commit timestamps.
 * @param {string|Date|number} date
 * @returns {string}
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a date as "Jan 5, 2025 at 3:42 PM" — used for tooltip hover states.
 * @param {string|Date|number} date
 * @returns {string}
 */
export function formatDateTime(date) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Returns true if the date is within the last N days.
 * Useful for highlighting recently updated repositories.
 * @param {string|Date|number} date
 * @param {number} days
 * @returns {boolean}
 */
export function isRecent(date, days = 7) {
  return Date.now() - new Date(date).getTime() < days * DAY;
}
