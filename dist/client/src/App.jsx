import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/Navbar";
import Game from "@/pages/Game";
import Folders from "@/pages/Folders";
import FolderDetail from "@/pages/FolderDetail";
import AddStory from "@/pages/AddStory";
import EditStory from "@/pages/EditStory";
function Router() {
    return (<Switch>
      <Route path="/" component={Game}/>
      <Route path="/folders" component={Folders}/>
      <Route path="/folders/:id" component={FolderDetail}/>
      <Route path="/folders/:id/add-story" component={AddStory}/>
      <Route path="/folders/:id/stories/:storyId/edit" component={EditStory}/>
      <Route component={NotFound}/>
    </Switch>);
}
function App() {
    return (<QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Router />
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>);
}
export default App;
