import { SupabaseClient } from "@supabase/supabase-js";
import type { Article, Category } from "@/types/database";

/** 获取文章列表（分页 + 分类筛选） */
export async function getArticles(
  supabase: SupabaseClient,
  options: {
    categorySlug?: string;
    page?: number;
    pageSize?: number;
    featured?: boolean;
  } = {}
) {
  const { categorySlug, page = 1, pageSize = 20, featured } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("articles")
    .select("*, source:sources(*)", { count: "exact" })
    .order("published_at", { ascending: false })
    .range(from, to);

  if (featured !== undefined) {
    query = query.eq("is_featured", featured);
  }

  if (categorySlug) {
    // 通过关联表筛选分类
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();

    if (cat) {
      const { data: articleIds } = await supabase
        .from("article_categories")
        .select("article_id")
        .eq("category_id", cat.id);

      const ids = articleIds?.map((r) => r.article_id) ?? [];
      query = query.in("id", ids.length > 0 ? ids : ["__none__"]);
    }
  }

  return query;
}

/** 获取单篇文章详情 */
export async function getArticleBySlug(
  supabase: SupabaseClient,
  slug: string
) {
  return supabase
    .from("articles")
    .select("*, source:sources(*)")
    .eq("slug", slug)
    .single<Article>();
}

/** 获取所有分类 */
export async function getCategories(supabase: SupabaseClient) {
  return supabase
    .from("categories")
    .select("*")
    .order("sort_order")
    .returns<Category[]>();
}
