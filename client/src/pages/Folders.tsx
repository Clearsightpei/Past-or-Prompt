import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Search } from "@/components/ui/search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useFolders } from "@/hooks/useFolders";
import { Lock, FolderOpen, Plus } from "lucide-react";

// Browse all collections (topics) + create a new one (optionally password-locked).
export default function Folders() {
  const [search, setSearch] = useState("");
  const { data: collections = [], isLoading } = useFolders(search);
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [password, setPassword] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/folders", {
        name: name.trim(),
        visibility,
        password: password.trim() || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      toast({ title: "Collection created" });
      setOpen(false);
      setName("");
      setVisibility("public");
      setPassword("");
    },
    onError: () => toast({ title: "Error", description: "Couldn't create the collection (private collections need a password).", variant: "destructive" }),
  });

  const canCreate = name.trim().length > 0 && (visibility === "public" || password.trim().length > 0);

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8 border-b border-stone-200 pb-6 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Collections</h1>
          <p className="mt-2 text-stone-600">Browse stories grouped by topic.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0">
              <Plus className="h-4 w-4 mr-1.5" />
              New collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New collection</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); if (canCreate) createMutation.mutate(); }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="c-name">Name</Label>
                <Input
                  id="c-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  placeholder="e.g. Startup stories"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Who can read it?</Label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-start gap-2 text-sm cursor-pointer">
                    <input type="radio" name="vis" className="mt-1" checked={visibility === "public"} onChange={() => setVisibility("public")} />
                    <span><span className="font-medium text-stone-800">Public</span> — anyone can read the stories inside.</span>
                  </label>
                  <label className="flex items-start gap-2 text-sm cursor-pointer">
                    <input type="radio" name="vis" className="mt-1" checked={visibility === "private"} onChange={() => setVisibility("private")} />
                    <span><span className="font-medium text-stone-800">Private</span> — a password is needed to read inside.</span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="c-pw">
                  Password {visibility === "private"
                    ? <span className="text-stone-400">(required)</span>
                    : <span className="text-stone-400">(optional)</span>}
                </Label>
                <Input
                  id="c-pw"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={128}
                  placeholder={visibility === "private" ? "Required to read inside" : "Lets you edit/manage it later"}
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-stone-400">
                  The password is the access key — whoever has it can edit and delete stories
                  here{visibility === "private" ? " and read the private contents" : ""}. The
                  game always reveals every collection. Keep it safe; it can't be recovered.
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={!canCreate || createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="mb-8 max-w-sm">
        <Search placeholder="Search collections..." value={search} onChange={setSearch} />
      </div>

      {isLoading ? (
        <p className="text-center text-stone-500 py-12">Loading...</p>
      ) : collections.length === 0 ? (
        <p className="text-center text-stone-500 py-12">No collections found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((c) => (
            <Link
              key={c.id}
              href={`/collections/${c.id}`}
              className="rounded-lg border border-stone-200 bg-white p-5 hover:border-stone-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                {c.has_password ? (
                  <Lock className="h-4 w-4 text-stone-400" />
                ) : (
                  <FolderOpen className="h-4 w-4 text-stone-400" />
                )}
                <h2 className="font-serif text-lg font-semibold text-stone-900">{c.name}</h2>
              </div>
              <p className="text-sm text-stone-500">
                {c.story_count} {c.story_count === 1 ? "story" : "stories"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
