export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} AI Daily News. All rights reserved.</p>
        <p className="mt-1">Aggregating the latest AI news from across the web.</p>
      </div>
    </footer>
  );
}
