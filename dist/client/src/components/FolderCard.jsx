import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function FolderCard(_a) {
    var folder = _a.folder, onEdit = _a.onEdit, onDelete = _a.onDelete, onViewStories = _a.onViewStories;
    var isGeneral = folder.id === 1;
    return (<Card className="bg-[#1a3c42] rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-[#00ffe0]">{folder.name}</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-light text-primary">
            {folder.story_count} {folder.story_count === 1 ? 'story' : 'stories'}
          </span>
        </div>
        <p className="mt-2 text-sm text-[#00ffe0]">
          {folder.id === 1
            ? "Contains all stories from all folders"
            : "Collection of historical true or false stories"}
        </p>
      </CardContent>
      <CardFooter className="border-t border-[#00ffe0] bg-[#1a3c42] px-5 py-3">
        <div className="flex justify-between w-full">
          {onViewStories ? (<button className="text-sm font-medium text-primary hover:text-primary-dark bg-transparent border-none p-0 m-0 cursor-pointer" onClick={onViewStories} style={{ background: 'none' }}>
              View Stories
            </button>) : (<a className="text-sm font-medium text-primary hover:text-primary-dark" href={"/folders/".concat(folder.id)}>
              View Stories
            </a>)}
          <div className="flex space-x-3">
            <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-neutral-700 p-0 h-auto" onClick={onEdit} title="Edit folder">
              <Pencil className="h-4 w-4"/>
            </Button>
            
            {!isGeneral && (<Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 p-0 h-auto" onClick={onDelete} title="Delete folder">
                <Trash2 className="h-4 w-4"/>
              </Button>)}
          </div>
        </div>
      </CardFooter>
    </Card>);
}
