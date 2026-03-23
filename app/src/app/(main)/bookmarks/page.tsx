"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ArticleList from "@/components/article/ArticleList";
import type { Article } from "@/types/database";

export default function BookmarksPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookmarks() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("bookmarks")
        .select("article:articles(*, source:sources(*))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const bookmarkedArticles =
        data?.map((b: Record<string, unknown>) => b.article as Article).filter(Boolean) ?? [];
      setArticles(bookmarkedArticles);
      setLoading(false);
    }

    fetchBookmarks();
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading...</div>;
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Bookmarks</h1>
      <ArticleList articles={articles} />
    </>
  );
}
