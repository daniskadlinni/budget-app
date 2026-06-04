import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === "POST") {
      const body = await req.json();
      const { accounts, categories, transactions, budgets, goals, subscriptions } = body;

      await supabase.from("sync_data").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      if (accounts) await supabase.from("sync_data").upsert({ key: "accounts", value: JSON.stringify(accounts) }, { onConflict: "key" });
      if (categories) await supabase.from("sync_data").upsert({ key: "categories", value: JSON.stringify(categories) }, { onConflict: "key" });
      if (transactions) await supabase.from("sync_data").upsert({ key: "transactions", value: JSON.stringify(transactions) }, { onConflict: "key" });
      if (budgets) await supabase.from("sync_data").upsert({ key: "budgets", value: JSON.stringify(budgets) }, { onConflict: "key" });
      if (goals) await supabase.from("sync_data").upsert({ key: "goals", value: JSON.stringify(goals) }, { onConflict: "key" });
      if (subscriptions) await supabase.from("sync_data").upsert({ key: "subscriptions", value: JSON.stringify(subscriptions) }, { onConflict: "key" });

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "GET") {
      const { data, error } = await supabase.from("sync_data").select("*");
      if (error) throw error;

      const result = {};
      data?.forEach((row) => { result[row.key] = JSON.parse(row.value); });

      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
