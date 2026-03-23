import { createClient } from "@/lib/supabase/server";
import { getArticleBySlug } from "@/lib/queries";
import { notFound } from "next/navigation";

export const revalidate = 600;

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: article } = await getArticleBySlug(supabase, slug);

  if (!article) notFound();

  const date = new Date(article.published_at).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="mx-auto max-w-3xl">
      {article.image_url && (
        <img
          src={article.image_url}
          alt={article.title}
          className="mb-6 w-full rounded-lg object-cover"
        />
      )}

      <h1 className="text-3xl font-bold text-gray-900">{article.title}</h1>

      <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
        {article.source && <span>{article.source.name}</span>}
        {article.author && <span>· {article.author}</span>}
        <time dateTime={article.published_at}>{date}</time>
      </div>

      {article.summary && (
        <p className="mt-6 rounded-lg bg-blue-50 p-4 text-gray-700">
          {article.summary}
        </p>
      )}

      {article.content && (
        <div
          className="prose prose-gray mt-8 max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      )}

      <div className="mt-8 border-t pt-4">
        <a
          href={article.original_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          阅读原文 &rarr;
        </a>
      </div>
    </article>
  );
}
