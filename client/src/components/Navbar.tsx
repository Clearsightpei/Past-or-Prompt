import { useState } from "react";
import { useLocation, Link } from "wouter";
import { BookOpen, Menu, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const logout = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/auth/logout", {}); },
    onSuccess: () => { queryClient.clear(); setOpen(false); navigate("/"); },
  });

  const links = [
    { href: "/", label: "Archive", match: (l: string) => l === "/" || l.startsWith("/story") },
    { href: "/submit", label: "Submit", match: (l: string) => l.startsWith("/submit") },
    { href: "/collections", label: "Collections", match: (l: string) => l.startsWith("/collections") || l.startsWith("/folders") },
    { href: "/game", label: "Game", match: (l: string) => l.startsWith("/game") },
  ];
  if (user) {
    links.push({ href: "/my", label: "My Stories", match: (l: string) => l.startsWith("/my") });
    links.push({ href: "/settings", label: "Settings", match: (l: string) => l.startsWith("/settings") });
  }

  const linkClass = (active: boolean) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      active ? "text-stone-900 bg-stone-100" : "text-stone-500 hover:text-stone-900"
    }`;

  return (
    <nav className="bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <BookOpen className="h-6 w-6 text-stone-800" />
            <span className="font-serif text-lg font-bold text-stone-900">Treehole Archive</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.match(location))}>
                {link.label}
              </Link>
            ))}
            {user ? (
              <button onClick={() => logout.mutate()} className="px-3 py-2 rounded-md text-sm font-medium text-stone-500 hover:text-stone-900">
                Log out
              </button>
            ) : (
              <Link href="/account" className={linkClass(location.startsWith("/account"))}>Log in</Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 text-stone-700" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 flex flex-col gap-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={linkClass(link.match(location))}>
                {link.label}
              </Link>
            ))}
            {user ? (
              <button onClick={() => logout.mutate()} className="text-left px-3 py-2 rounded-md text-sm font-medium text-stone-500 hover:text-stone-900">
                Log out
              </button>
            ) : (
              <Link href="/account" onClick={() => setOpen(false)} className={linkClass(location.startsWith("/account"))}>Log in</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
