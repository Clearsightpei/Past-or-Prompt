import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "@/context/SessionContext";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/Navbar";
import Archive from "@/pages/Archive";
import StoryView from "@/pages/StoryView";
import Submit from "@/pages/Submit";
import Game from "@/pages/Game";
import Folders from "@/pages/Folders";
import FolderDetail from "@/pages/FolderDetail";
import EditStory from "@/pages/EditStory";
import AdminReview from "@/pages/AdminReview";
import Account from "@/pages/Account";
import MyStories from "@/pages/MyStories";
import Forgot from "@/pages/Forgot";
import Reset from "@/pages/Reset";
import Settings from "@/pages/Settings";

function Router() {
  return (
    <Switch>
      {/* Treehole archive (read-first) */}
      <Route path="/" component={Archive} />
      <Route path="/story/:id" component={StoryView} />
      <Route path="/submit" component={Submit} />

      {/* Collections (formerly "folders") */}
      <Route path="/collections" component={Folders} />
      <Route path="/collections/:id" component={FolderDetail} />
      <Route path="/collections/:id/stories/:storyId/edit" component={EditStory} />

      {/* Game (sub-feature) */}
      <Route path="/game" component={Game} />

      {/* Accounts */}
      <Route path="/account" component={Account} />
      <Route path="/my" component={MyStories} />
      <Route path="/settings" component={Settings} />
      <Route path="/forgot" component={Forgot} />
      <Route path="/reset" component={Reset} />

      {/* Admin moderation */}
      <Route path="/admin" component={AdminReview} />

      {/* Back-compat redirects for old /folders/* links */}
      <Route path="/folders"><Redirect to="/collections" /></Route>
      <Route path="/folders/:id">{(p) => <Redirect to={`/collections/${p.id}`} />}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-stone-50">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <Router />
          </main>
        </div>
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  );
}

export default App;
