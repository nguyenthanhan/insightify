/**
 * Cloudflare Workers API Proxy for Anthropic Claude
 *
 * This function acts as a secure proxy between the frontend and Anthropic API.
 * API keys are stored in Cloudflare environment variables, never exposed to client.
 */

interface Env {
  ANTHROPIC_API_KEY: string;
  ALLOWED_ORIGINS?: string;
  API_SECRET?: string;
}

interface AnthropicRequest {
  messages: Array<{
    role: "user" | "assistant";
    content: string | unknown[];
  }>;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  system?: string;
  stream?: boolean;
  tools?: unknown[];
}

// Rate limiting per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX_REQUESTS = 20;

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
    : ["http://localhost:3000", "http://localhost:5173"];

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
    const body = (await request.json()) as AnthropicRequest;

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

    // Get API key from environment
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY not configured in environment");
      return new Response(
        JSON.stringify({ error: "API configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Prepare Anthropic request
    const anthropicRequest = {
      model: body.model || "claude-3-5-sonnet-20241022",
      messages: body.messages,
      max_tokens: body.max_tokens ?? 2000,
      temperature: body.temperature ?? 0.7,
      stream: body.stream ?? false,
      ...(body.system && { system: body.system }),
      ...(body.tools && { tools: body.tools }),
    };

    // Call Anthropic API
    const anthropicResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(anthropicRequest),
      },
    );

    // Handle Anthropic errors
    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json();
      console.error("Anthropic API error:", errorData);

      const sanitizedError =
        anthropicResponse.status >= 500
          ? "AI service temporarily unavailable"
          : "Invalid request to AI service";

      return new Response(
        JSON.stringify({
          error: sanitizedError,
          status: anthropicResponse.status,
        }),
        {
          status: anthropicResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (body.stream && anthropicResponse.body) {
      return new Response(anthropicResponse.body, {
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
    const data = await anthropicResponse.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Proxy error:", error);
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
