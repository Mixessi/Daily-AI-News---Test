import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 使用 service role key 绕过 RLS
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Cron endpoint: 定时拉取 RSS feeds
 * 可通过 Vercel Cron 或外部调度器触发
 * GET /api/cron/fetch-feeds?token=YOUR_CRON_SECRET
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // 获取活跃的 RSS/Atom 来源
  const { data: sources } = await supabase
    .from("sources")
    .select("*")
    .eq("is_active", true)
    .in("feed_type", ["rss", "atom"]);

  const results: { source: string; new: number; error?: string }[] = [];

  for (const source of sources ?? []) {
    if (!source.feed_url) continue;

    try {
      // TODO: 实现具体的 RSS 解析逻辑
      // 1. fetch(source.feed_url)
      // 2. 解析 XML
      // 3. 去重后插入 articles 表
      results.push({ source: source.name, new: 0 });
    } catch (err) {
      results.push({
        source: source.name,
        new: 0,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ ok: true, results });
}
