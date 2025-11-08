const zlib = require('zlib');

/**
 * Compression middleware for HTTP responses
 * Uses gzip compression for responses larger than threshold
 */
function compressionMiddleware(options = {}) {
  const {
    threshold = 1024, // 1KB minimum
    level = 6, // Default compression level (0-9)
    filter = defaultFilter
  } = options;

  return (req, res, next) => {
    // Store original res.write and res.end
    const originalWrite = res.write;
    const originalEnd = res.end;
    const chunks = [];

    // Check if client accepts gzip
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const shouldCompress = acceptEncoding.includes('gzip');

    // Skip compression header
    if (req.headers['x-no-compression']) {
      return next();
    }

    // Override res.write to collect chunks
    res.write = function(chunk, encoding) {
      if (chunk) {
        chunks.push(Buffer.from(chunk, encoding));
      }
      return true;
    };

    // Override res.end to compress if needed
    res.end = function(chunk, encoding) {
      if (chunk) {
        chunks.push(Buffer.from(chunk, encoding));
      }

      // Restore original functions first
      res.write = originalWrite;
      res.end = originalEnd;

      // Combine all chunks
      const buffer = Buffer.concat(chunks);

      // Check if should compress
      if (!shouldCompress || buffer.length < threshold || !filter(req, res)) {
        return res.end(buffer);
      }

      // Compress and send
      zlib.gzip(buffer, { level }, (err, compressed) => {
        if (err) {
          return res.end(buffer);
        }

        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Length', compressed.length);
        res.removeHeader('Content-Length'); // Let Node handle this
        res.end(compressed);
      });
    };

    next();
  };
}

/**
 * Default filter function
 * Determines if response should be compressed
 */
function defaultFilter(req, res) {
  const contentType = res.getHeader('content-type') || '';

  // Compress text-based responses
  const compressibleTypes = [
    'text/',
    'application/json',
    'application/javascript',
    'application/xml'
  ];

  return compressibleTypes.some((type) => contentType.includes(type));
}

module.exports = compressionMiddleware;
