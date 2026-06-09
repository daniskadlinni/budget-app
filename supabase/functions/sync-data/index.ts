import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function mergeArrays(local: any[], server: any[], idField = 'id') {
  const map = new Map();
  server?.forEach((item) => map.set(item[idField], item));
  local?.forEach((item) => {
    if (!map.has(item[idField])) map.set(item[idField], item);
  });
  return Array.from(map.values());
}

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

      const { data: existing } = await supabase.from("sync_data").select("*");

      if (accounts) {
        const serverAccounts = JSON.parse(existing?.find(r => r.key === 'accounts')?.value || '[]');
        const merged = mergeArrays(accounts, serverAccounts);
        await supabase.from("sync_data").upsert({ key: "accounts", value: JSON.stringify(merged) }, { onConflict: "key" });
      }
      if (categories) {
        const serverCategories = JSON.parse(existing?.find(r => r.key === 'categories')?.value || '[]');
        const merged = mergeArrays(categories, serverCategories);
        await supabase.from("sync_data").upsert({ key: "categories", value: JSON.stringify(merged) }, { onConflict: "key" });
      }
      if (transactions) {
        const serverTransactions = JSON.parse(existing?.find(r => r.key === 'transactions')?.value || '[]');
        const merged = mergeArrays(transactions, serverTransactions);
        await supabase.from("sync_data").upsert({ key: "transactions", value: JSON.stringify(merged) }, { onConflict: "key" });
      }
      if (budgets) {
        const serverBudgets = JSON.parse(existing?.find(r => r.key === 'budgets')?.value || '[]');
        const merged = mergeArrays(budgets, serverBudgets);
        await supabase.from("sync_data").upsert({ key: "budgets", value: JSON.stringify(merged) }, { onConflict: "key" });
      }
      if (goals) {
        const serverGoals = JSON.parse(existing?.find(r => r.key === 'goals')?.value || '[]');
        const merged = mergeArrays(goals, serverGoals);
        await supabase.from("sync_data").upsert({ key: "goals", value: JSON.stringify(merged) }, { onConflict: "key" });
      }
      if (subscriptions) {
        const serverSubs = JSON.parse(existing?.find(r => r.key === 'subscriptions')?.value || '[]');
        const merged = mergeArrays(subscriptions, serverSubs);
        await supabase.from("sync_data").upsert({ key: "subscriptions", value: JSON.stringify(merged) }, { onConflict: "key" });
      }

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
