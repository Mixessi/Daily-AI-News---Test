import { createClient } from "@/lib/supabase/server";
import { getArticles } from "@/lib/queries";
import ArticleList from "@/components/article/ArticleList";
import type { Article } from "@/types/database";

export const revalidate = 300; // ISR: 5 分钟

export default async function HomePage() {
  const supabase = await createClient();

  // 获取置顶文章
  const { data: featured } = await getArticles(supabase, {
    featured: true,
    pageSize: 3,
  });

  // 获取最新文章
  const { data: latest } = await getArticles(supabase, { pageSize: 12 });

  return (
    <>
      {/* Hero / Featured */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Featured</h2>
        <ArticleList articles={(featured as Article[]) ?? []} />
      </section>

      {/* Latest */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-900">Latest</h2>
        <ArticleList articles={(latest as Article[]) ?? []} />
      </section>
    </>
  );
}
