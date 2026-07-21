export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-neutral-500 sm:px-6 lg:px-8">
        <p>&copy; {new Date().getFullYear()} TheUniqPick. All rights reserved.</p>
      </div>
    </footer>
  );
}
