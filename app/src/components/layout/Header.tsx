import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries";

export default async function Header() {
  const supabase = await createClient();
  const { data: categories } = await getCategories(supabase);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-gray-900">
          AI Daily News
        </Link>

        <nav className="hidden gap-4 md:flex">
          {categories?.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="text-sm text-gray-600 transition hover:text-gray-900"
            >
              {cat.name}
            </Link>
          ))}
        </nav>

        <Link
          href="/bookmarks"
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white transition hover:bg-gray-700"
        >
          Bookmarks
        </Link>
      </div>
    </header>
  );
}
