import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SignupPayload = {
  name?: unknown;
  email?: unknown;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function isDuplicateError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "23505" || /duplicate key/i.test(error.message || "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let payload: SignupPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON payload" }, 400);
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";

  if (!name || !emailPattern.test(email)) {
    return jsonResponse({ error: "A valid name and email are required" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const notifyTo = Deno.env.get("NEWSLETTER_NOTIFY_TO") || "brisvosocial@gmail.com";
  const from = Deno.env.get("NEWSLETTER_FROM");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Supabase service configuration is missing" }, 500);
  }

  if (!resendApiKey || !from) {
    return jsonResponse({ error: "Newsletter email configuration is missing" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const signedUpAt = new Date().toISOString();
  const { error: insertError } = await supabase
    .from("subscribers")
    .insert({ name, email });

  if (insertError && !isDuplicateError(insertError)) {
    console.error("Newsletter subscriber insert failed", insertError);
    return jsonResponse({ error: "Could not save newsletter signup" }, 500);
  }

  const duplicate = isDuplicateError(insertError);

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSignedUpAt = escapeHtml(signedUpAt);
  const statusLine = duplicate ? "Existing subscriber submitted the newsletter form again." : "New subscriber saved.";

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [notifyTo],
      subject: duplicate ? "BrisVO newsletter signup already exists" : "New BrisVO newsletter signup",
      reply_to: email,
      text: [
        "New BrisVO newsletter signup",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Signed up at: ${signedUpAt}`,
        `Status: ${statusLine}`,
      ].join("\n"),
      html: `
        <h1>New BrisVO newsletter signup</h1>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Signed up at:</strong> ${safeSignedUpAt}</p>
        <p><strong>Status:</strong> ${escapeHtml(statusLine)}</p>
      `,
    }),
  });

  if (!emailResponse.ok) {
    const errorText = await emailResponse.text();
    console.error("Newsletter notification email failed", errorText);
    return jsonResponse({ error: "Could not send newsletter notification" }, 502);
  }

  return jsonResponse({ ok: true, duplicate });
});
