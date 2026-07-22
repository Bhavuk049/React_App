export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-10 text-sm text-neutral-500 sm:px-6 lg:px-8">
        <img src="/logo.webp" alt="TheUniqPick" className="h-14 w-auto" />
        <p>&copy; {new Date().getFullYear()} TheUniqPick. All rights reserved.</p>
      </div>
    </footer>
  );
}
