import Link from "next/link";
import type { Article } from "@/types/database";

export default function ArticleCard({ article }: { article: Article }) {
  const date = new Date(article.published_at).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });

  return (
    <article className="group rounded-lg border border-gray-200 bg-white p-4 transition hover:shadow-md">
      {article.image_url && (
        <div className="mb-3 overflow-hidden rounded-md">
          <img
            src={article.image_url}
            alt={article.title}
            className="h-40 w-full object-cover transition group-hover:scale-105"
          />
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-500">
        {article.source && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium">
            {article.source.name}
          </span>
        )}
        <time dateTime={article.published_at}>{date}</time>
      </div>

      <Link href={`/article/${article.slug}`}>
        <h3 className="mt-2 font-semibold leading-snug text-gray-900 transition group-hover:text-blue-600">
          {article.title}
        </h3>
      </Link>

      {article.summary && (
        <p className="mt-1.5 line-clamp-2 text-sm text-gray-600">
          {article.summary}
        </p>
      )}
    </article>
  );
}
