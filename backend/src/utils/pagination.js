/**
 * Pagination helper — shared by repository search and skills routes.
 * Converts raw query params into validated, safe page/limit integers.
 */

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse and clamp pagination params from an Express request query.
 * @param {object} query - req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build a standard paginated response envelope.
 * @param {Array} data - The items for this page
 * @param {number} total - Total item count across all pages
 * @param {number} page - Current page number (1-based)
 * @param {number} limit - Items per page
 * @returns {object}
 */
export function paginatedResponse(data, total, page, limit) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
}
