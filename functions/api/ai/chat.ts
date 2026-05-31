/**
 * Cloudflare Workers API Proxy for OpenAI
 *
 * This function acts as a secure proxy between the frontend and OpenAI API.
 * API keys are stored in Cloudflare environment variables, never exposed to client.
 *
 * Deploy: Cloudflare Pages automatically deploys functions in /functions directory
 */

interface Env {
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY?: string;
  ALLOWED_ORIGINS?: string; // Comma-separated list of allowed origins
  API_SECRET?: string; // Optional API secret for request authentication
}

interface ChatRequest {
  messages: Array<{
    role: "system" | "user" | "assistant" | "tool";
    content: string | null;
    tool_calls?: unknown[];
    tool_call_id?: string;
  }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: unknown[];
}

// Rate limiting per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per minute per IP

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

function getCorsHeaders(
  origin: string | null,
  env: Env,
): Record<string, string> {
  const allowedOrigins = env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : ["http://localhost:3000", "http://localhost:5173"]; // Default for development

  const isAllowed = origin && allowedOrigins.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Secret",
    "Access-Control-Max-Age": "86400",
  };
}

function verifyRequest(
  request: Request,
  env: Env,
): { valid: boolean; error?: string } {
  // Optional API secret verification
  if (env.API_SECRET) {
    const providedSecret = request.headers.get("X-API-Secret");
    if (providedSecret !== env.API_SECRET) {
      return { valid: false, error: "Invalid API secret" };
    }
  }

  return { valid: true };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const origin = request.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin, env);

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
  const rateLimitCheck = checkRateLimit(clientIP);

  if (!rateLimitCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        retryAfter: rateLimitCheck.retryAfter,
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(rateLimitCheck.retryAfter),
        },
      },
    );
  }

  // Verify request authentication
  const verification = verifyRequest(request, env);
  if (!verification.valid) {
    return new Response(JSON.stringify({ error: verification.error }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Parse request body
    const body = (await request.json()) as ChatRequest;

    // Validate request
    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: messages array required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get API key from environment (secure, never exposed to client)
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY not configured in environment");
      return new Response(
        JSON.stringify({ error: "API configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Prepare OpenAI request
    const openaiRequest = {
      model: body.model || "gpt-4o-mini",
      messages: body.messages,
      temperature: body.temperature ?? 0.7,
      max_tokens: body.max_tokens ?? 2000,
      stream: body.stream ?? false,
      ...(body.tools && { tools: body.tools }),
    };

    // Call OpenAI API
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(openaiRequest),
      },
    );

    // Handle OpenAI errors
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("OpenAI API error:", errorData);

      // Sanitize error message - don't expose internal details
      const sanitizedError =
        openaiResponse.status >= 500
          ? "AI service temporarily unavailable"
          : "Invalid request to AI service";

      return new Response(
        JSON.stringify({
          error: sanitizedError,
          status: openaiResponse.status,
        }),
        {
          status: openaiResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (body.stream && openaiResponse.body) {
      return new Response(openaiResponse.body, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Return successful response
    const data = await openaiResponse.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    // Don't expose internal error details
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
};
