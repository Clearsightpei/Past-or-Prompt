import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Story } from "@shared/schema";
import { Search } from "@/components/ui/search";
import { Button } from "@/components/ui/button";
import { useFolders } from "@/hooks/useFolders";
import { PenLine, BookOpen, Sparkles } from "lucide-react";

const PAGE = 20;

// Read-first archive home: a browsable feed of approved community stories.
export default function Archive() {
  const [search, setSearch] = useState("");
  const [collectionId, setCollectionId] = useState<string>("");
  const [sort, setSort] = useState<"new" | "old">("new");
  const [limit, setLimit] = useState(PAGE);

  const { data: collections } = useFolders();

  // Reset paging when the filters change.
  useEffect(() => { setLimit(PAGE); }, [search, collectionId, sort]);

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['/api/stories', { folder: collectionId, search, sort, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (collectionId) params.set("folder", collectionId);
      if (search) params.set("search", search);
      if (!collectionId) { params.set("sort", sort); params.set("limit", String(limit)); }
      const response = await fetch(`/api/stories?${params.toString()}`, { credentials: "include" });
      if (!response.ok) throw new Error('Failed to fetch stories');
      return response.json() as Promise<Story[]>;
    },
  });

  // "Load more" only applies to the unfiltered feed (collection view returns all).
  const canLoadMore = !collectionId && stories.length >= limit;

  return (
    <div className="max-w-3xl mx-auto">
      <header className="text-center mb-10 border-b border-stone-200 pb-8">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 tracking-tight">Treehole Archive</h1>
        <p className="mt-4 text-stone-600 text-lg leading-relaxed max-w-2xl mx-auto">
          A public space to share and preserve true personal stories for the future. Explore the
          collection, contribute your own experiences, and play the game to see if you can spot the
          difference between truth and AI misinformation. Join us in protecting our collective
          history from digital distortion.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/submit" className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-700 transition-colors">
            <PenLine className="h-4 w-4" /> Share your story
          </Link>
          <Link href="/game" className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors">
            <Sparkles className="h-4 w-4" /> Play the game
          </Link>
        </div>
      </header>

      <div className="mb-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1">
          <Search placeholder="Search stories..." value={search} onChange={setSearch} />
        </div>
        <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)} className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-400">
          <option value="">All collections</option>
          {collections?.map((c) => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as "new" | "old")} className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-400">
          <option value="new">Newest</option>
          <option value="old">Oldest</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-center text-stone-500 py-12">Loading stories...</p>
      ) : stories.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-10 w-10 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-600 mb-2">No stories here yet.</p>
          <Link href="/submit" className="text-stone-900 underline underline-offset-4">Be the first to share one.</Link>
        </div>
      ) : (
        <>
          <div className="space-y-5">
            {stories.map((story) => (
              <Link key={story.id} href={`/story/${story.id}`} className="block rounded-lg border border-stone-200 bg-white p-6 hover:border-stone-400 hover:shadow-sm transition-all">
                {story.event && <h2 className="font-serif text-xl font-semibold text-stone-900 mb-2">{story.event}</h2>}
                <p className="text-stone-600 leading-relaxed line-clamp-3">
                  {story.true_version.trim()
                    ? story.true_version
                    : (story as any).transcript?.trim()
                    ? (story as any).transcript
                    : (story as any).audio_url ? "🎙️ Audio story" : ""}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs text-stone-400">
                  <CollectionTag collectionId={story.folder_id} collections={collections} />
                  <span>{new Date((story as any).display_date ? (story as any).display_date + "T00:00:00" : story.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
          {canLoadMore && (
            <div className="text-center mt-8">
              <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)}>Load more</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CollectionTag({ collectionId, collections }: { collectionId: number; collections?: { id: number; name: string }[] }) {
  const name = collections?.find((c) => c.id === collectionId)?.name;
  if (!name) return null;
  return <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-500">{name}</span>;
}
