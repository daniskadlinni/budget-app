import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const dataTypes: Record<string, string> = {
  accounts: "account",
  categories: "category",
  transactions: "transaction",
  budgets: "budget",
  goals: "goal",
  subscriptions: "subscription",
  stores: "store",
  shopping: "shopping",
  products: "product",
  reminders: "reminder",
};

function mergeDeletedIds(local: any[] = [], server: any[] = []) {
  const map = new Map();
  [...server, ...local].forEach((item) => {
    if (item?.type && item?.id) map.set(`${item.type}:${item.id}`, item);
  });
  return Array.from(map.values());
}

function mergeArrays(local: any[] = [], server: any[] = [], deletedIds: any[] = [], type: string, idField = "id") {
  const deleted = new Set(
    deletedIds
      .filter((item) => item?.type === type)
      .map((item) => item.id)
  );
  const map = new Map();

  [...server, ...local].forEach((item) => {
    const id = item?.[idField];
    if (!id || deleted.has(id)) return;

    const existing = map.get(id);
    if (!existing) {
      map.set(id, item);
      return;
    }

    const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
    const itemTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
    if (itemTime >= existingTime) map.set(id, item);
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
      const {
        accounts,
        categories,
        transactions,
        budgets,
        goals,
        subscriptions,
        stores,
        shopping,
        products,
        reminders,
        deletedIds,
      } = body;

      const { data: existing } = await supabase.from("sync_data").select("*");

      const existingDeletedIds = JSON.parse(existing?.find(r => r.key === "deletedIds")?.value || "[]");
      const mergedDeletedIds = mergeDeletedIds(deletedIds, existingDeletedIds);
      await supabase.from("sync_data").upsert({ key: "deletedIds", value: JSON.stringify(mergedDeletedIds) }, { onConflict: "key" });

      const incoming: Record<string, any[] | undefined> = {
        accounts,
        categories,
        transactions,
        budgets,
        goals,
        subscriptions,
        stores,
        shopping,
        products,
        reminders,
      };

      for (const [key, value] of Object.entries(incoming)) {
        if (value === undefined) continue;

        const serverValue = JSON.parse(existing?.find(r => r.key === key)?.value || "[]");
        const merged = mergeArrays(value, serverValue, mergedDeletedIds, dataTypes[key]);
        await supabase.from("sync_data").upsert({ key, value: JSON.stringify(merged) }, { onConflict: "key" });
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
