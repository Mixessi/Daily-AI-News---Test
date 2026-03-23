import { createClient } from "@/lib/supabase/server";
import { getArticles, getCategories } from "@/lib/queries";
import ArticleList from "@/components/article/ArticleList";
import { notFound } from "next/navigation";
import type { Article } from "@/types/database";

export const revalidate = 300;

export async function generateStaticParams() {
  const supabase = await createClient();
  const { data: categories } = await getCategories(supabase);
  return (categories ?? []).map((cat) => ({ slug: cat.slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // 验证分类存在
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!category) notFound();

  const { data: articles } = await getArticles(supabase, {
    categorySlug: slug,
    pageSize: 24,
  });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
        {category.description && (
          <p className="mt-1 text-gray-500">{category.description}</p>
        )}
      </div>
      <ArticleList articles={(articles as Article[]) ?? []} />
    </>
  );
}
