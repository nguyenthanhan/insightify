/**
 * Cloudflare Pages Middleware
 *
 * This middleware adds security headers to all responses.
 * It runs before all other functions and applies to all routes.
 *
 * Security Headers:
 * - Content-Security-Policy: Prevents XSS attacks
 * - X-Frame-Options: Prevents clickjacking
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - Referrer-Policy: Controls referrer information
 * - Permissions-Policy: Controls browser features
 */

export const onRequest: PagesFunction = async (context) => {
  // Get the response from the next function/page
  const response = await context.next();

  // Clone the response so we can modify headers
  const newResponse = new Response(response.body, response);

  // Add security headers
  const securityHeaders = {
    // Content Security Policy - More flexible for modern apps
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Allow inline scripts for React
      "style-src 'self' 'unsafe-inline'", // Allow inline styles for Tailwind
      "connect-src 'self' https://api.openai.com https://api.anthropic.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),

    // Prevent clickjacking
    "X-Frame-Options": "DENY",

    // Prevent MIME sniffing
    "X-Content-Type-Options": "nosniff",

    // Control referrer information
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Permissions Policy (formerly Feature Policy)
    "Permissions-Policy": [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
    ].join(", "),

    // Strict Transport Security (HTTPS only)
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",

    // Cross-Origin policies
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
  };

  // Apply all security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });

  return newResponse;
};
