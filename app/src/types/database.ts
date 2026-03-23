// 数据库类型定义 - 与 Supabase schema 对应

export interface Source {
  id: string;
  name: string;
  slug: string;
  url: string;
  logo_url: string | null;
  feed_url: string | null;
  feed_type: "rss" | "atom" | "api" | "scrape" | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface Article {
  id: string;
  source_id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  original_url: string;
  image_url: string | null;
  author: string | null;
  published_at: string;
  fetched_at: string;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  // joined fields
  source?: Source;
  categories?: Category[];
  tags?: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
  article?: Article;
}
