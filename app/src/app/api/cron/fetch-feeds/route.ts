import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Parser from "rss-parser";
import Anthropic from "@anthropic-ai/sdk";

// 使用 service role key 绕过 RLS
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const rssParser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "DailyAINews/1.0",
  },
});

// 将标题转为 URL 友好的 slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

// 用 Anthropic API 生成中文摘要
async function generateSummary(
  client: Anthropic,
  title: string,
  content: string
): Promise<string | null> {
  try {
    const text = content || title;
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `请用中文为以下 AI 资讯生成一段100字以内的摘要，直接输出摘要内容，不要加任何前缀：\n\n标题：${title}\n\n内容：${text.slice(0, 2000)}`,
        },
      ],
    });
    const block = message.content[0];
    if (block.type === "text") {
      return block.text.slice(0, 200);
    }
    return null;
  } catch (err) {
    console.error("Summary generation failed:", err);
    return null;
  }
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

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

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
      // 1. 拉取并解析 RSS/Atom feed
      const feed = await rssParser.parseURL(source.feed_url);

      let newCount = 0;

      for (const item of feed.items) {
        const url = item.link;
        if (!url) continue;

        // 2. 去重：检查 original_url 是否已存在
        const { count } = await supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("original_url", url);

        if (count && count > 0) continue;

        // 提取内容
        const title = item.title || "Untitled";
        const contentSnippet = item.contentSnippet || item.content || "";
        const imageUrl =
          item.enclosure?.url ||
          extractImageFromContent(item.content || "") ||
          null;
        const publishedAt = item.isoDate || new Date().toISOString();
        const author = item.creator || item.author || null;

        // 生成唯一 slug
        const baseSlug = generateSlug(title);
        const slug = `${baseSlug}-${Date.now().toString(36)}`;

        // 3. 用 Anthropic API 生成中文摘要
        const summary = await generateSummary(
          anthropic,
          title,
          contentSnippet
        );

        // 4. 写入 articles 表
        const { error: insertError } = await supabase.from("articles").insert({
          source_id: source.id,
          title,
          slug,
          summary,
          content: contentSnippet.slice(0, 5000) || null,
          original_url: url,
          image_url: imageUrl,
          author,
          published_at: publishedAt,
          is_featured: false,
        });

        if (insertError) {
          // original_url unique constraint 也会触发这里，跳过即可
          console.error(
            `Insert failed for "${title}":`,
            insertError.message
          );
          continue;
        }

        newCount++;
      }

      results.push({ source: source.name, new: newCount });
    } catch (err) {
      // 单个 source 失败不影响其他 source
      console.error(`Failed to fetch ${source.name}:`, err);
      results.push({
        source: source.name,
        new: 0,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ ok: true, results });
}

// 从 HTML 内容中提取第一张图片 URL
function extractImageFromContent(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/);
  return match?.[1] || null;
}
