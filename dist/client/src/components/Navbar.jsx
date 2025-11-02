import { useLocation, Link } from "wouter";
import { CheckCircle } from "lucide-react";
export default function Navbar() {
    var location = useLocation()[0];
    var isGameActive = location === "/" || location.startsWith("/?");
    var isFoldersActive = location.startsWith("/folders");
    return (<nav className="bg-[#5fa8d3] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <CheckCircle className="h-8 w-8 text-primary"/>
              <span className="ml-2 text-xl font-semibold text-neutral-800">Past or Prompt</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" className={"px-3 py-2 rounded-md text-sm font-medium ".concat(isGameActive
            ? 'text-primary border-b-2 border-primary'
            : 'text-neutral-600 hover:text-primary')}>
              Play Game
            </Link>
            <Link href="/folders" className={"px-3 py-2 rounded-md text-sm font-medium ".concat(isFoldersActive
            ? 'text-primary border-b-2 border-primary'
            : 'text-neutral-600 hover:text-primary')}>
              Manage Folders
            </Link>
          </div>
        </div>
      </div>
    </nav>);
}
