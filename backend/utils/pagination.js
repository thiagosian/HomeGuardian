/**
 * Pagination utility for database queries and API responses
 */

/**
 * Parse pagination parameters from request
 * @param {Object} query - Request query parameters
 * @returns {Object} Normalized pagination params
 */
function parsePaginationParams(query = {}) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 50));
  const offset = (page - 1) * limit;

  const sortBy = query.sortBy || 'created_at';
  const sortOrder = (query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  return {
    page,
    limit,
    offset,
    sortBy,
    sortOrder
  };
}

/**
 * Create paginated response
 * @param {Array} data - Data for current page
 * @param {number} total - Total count
 * @param {Object} params - Pagination parameters
 * @returns {Object} Paginated response
 */
function createPaginatedResponse(data, total, params) {
  const { page, limit } = params;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null
    }
  };
}

/**
 * Paginate array in memory (for small datasets)
 * @param {Array} array - Array to paginate
 * @param {Object} params - Pagination parameters
 * @returns {Object} Paginated response
 */
function paginateArray(array, params) {
  const { page, limit, offset } = parsePaginationParams(params);
  const total = array.length;
  const data = array.slice(offset, offset + limit);

  return createPaginatedResponse(data, total, { page, limit });
}

/**
 * Build SQL LIMIT/OFFSET clause
 * @param {Object} params - Pagination parameters
 * @returns {string} SQL clause
 */
function buildSQLPagination(params) {
  const { limit, offset, sortBy, sortOrder } = params;

  // Sanitize sortBy to prevent SQL injection
  const safeSortBy = sortBy.replace(/[^a-zA-Z0-9_]/g, '');

  return `ORDER BY ${safeSortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`;
}

/**
 * Create links for pagination (HATEOAS)
 * @param {string} baseUrl - Base URL
 * @param {Object} pagination - Pagination info
 * @returns {Object} Links object
 */
function createPaginationLinks(baseUrl, pagination) {
  const { page, totalPages } = pagination;

  const links = {
    self: `${baseUrl}?page=${page}`,
    first: `${baseUrl}?page=1`,
    last: `${baseUrl}?page=${totalPages}`
  };

  if (pagination.hasNextPage) {
    links.next = `${baseUrl}?page=${pagination.nextPage}`;
  }

  if (pagination.hasPreviousPage) {
    links.prev = `${baseUrl}?page=${pagination.previousPage}`;
  }

  return links;
}

module.exports = {
  parsePaginationParams,
  createPaginatedResponse,
  paginateArray,
  buildSQLPagination,
  createPaginationLinks
};
