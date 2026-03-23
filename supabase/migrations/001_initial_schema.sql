-- ============================================
-- AI 资讯聚合网站 - 数据库初始化
-- ============================================

-- 1. 资讯来源表
CREATE TABLE sources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,          -- 来源名称，如 "OpenAI Blog"
  slug        TEXT NOT NULL UNIQUE,          -- URL 友好标识
  url         TEXT NOT NULL,                 -- 来源网站 URL
  logo_url    TEXT,                          -- 来源 logo
  feed_url    TEXT,                          -- RSS/Atom feed 地址
  feed_type   TEXT CHECK (feed_type IN ('rss', 'atom', 'api', 'scrape')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 分类表
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,          -- 分类名称，如 "LLM", "Computer Vision"
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 文章表（核心表）
CREATE TABLE articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  summary         TEXT,                      -- AI 生成摘要
  content         TEXT,                      -- 正文（可选存储）
  original_url    TEXT NOT NULL UNIQUE,       -- 原文链接（去重依据）
  image_url       TEXT,                      -- 封面图
  author          TEXT,
  published_at    TIMESTAMPTZ NOT NULL,       -- 原文发布时间
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  view_count      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 文章-分类关联表（多对多）
CREATE TABLE article_categories (
  article_id   UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  category_id  UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

-- 5. 标签表
CREATE TABLE tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. 文章-标签关联表（多对多）
CREATE TABLE article_tags (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- 7. 书签/收藏表（用户行为）
CREATE TABLE bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,                 -- Supabase Auth user id
  article_id  UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, article_id)
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX idx_articles_source        ON articles(source_id);
CREATE INDEX idx_articles_published_at  ON articles(published_at DESC);
CREATE INDEX idx_articles_is_featured   ON articles(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_articles_slug          ON articles(slug);
CREATE INDEX idx_bookmarks_user         ON bookmarks(user_id);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- 文章：所有人可读
CREATE POLICY "Articles are publicly readable"
  ON articles FOR SELECT USING (TRUE);

-- 书签：用户只能管理自己的
CREATE POLICY "Users manage own bookmarks"
  ON bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 预置分类数据
-- ============================================
INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('LLM',              'llm',              '大语言模型相关资讯',     1),
  ('Computer Vision',  'computer-vision',  '计算机视觉',           2),
  ('AI Agents',        'ai-agents',        'AI 智能体',            3),
  ('Research',         'research',         '学术论文与研究',        4),
  ('Industry',         'industry',         '行业动态与融资',        5),
  ('Open Source',      'open-source',      '开源项目与工具',        6),
  ('Tutorial',         'tutorial',         '教程与实践',           7),
  ('Ethics & Safety',  'ethics-safety',    'AI 伦理与安全',        8);

-- ============================================
-- 预置资讯来源
-- ============================================
INSERT INTO sources (name, slug, url, feed_url, feed_type) VALUES
  ('OpenAI Blog',      'openai',       'https://openai.com/blog',           'https://openai.com/blog/rss.xml',           'rss'),
  ('Google AI Blog',   'google-ai',    'https://ai.googleblog.com',         'https://ai.googleblog.com/atom.xml',        'atom'),
  ('Hugging Face Blog','huggingface',  'https://huggingface.co/blog',       NULL,                                         'scrape'),
  ('The Verge AI',     'verge-ai',     'https://www.theverge.com/ai-artificial-intelligence', NULL,                       'scrape'),
  ('ArXiv CS.AI',      'arxiv-ai',     'https://arxiv.org/list/cs.AI/recent', 'https://rss.arxiv.org/rss/cs.AI',         'rss');
