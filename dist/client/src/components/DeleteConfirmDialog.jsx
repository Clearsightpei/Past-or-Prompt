import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
export default function DeleteConfirmDialog(_a) {
    var open = _a.open, onOpenChange = _a.onOpenChange, title = _a.title, description = _a.description, onConfirm = _a.onConfirm;
    return (<AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#1a3c42]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#00ffe0]">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[#00ffe0]">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-[#1a3c42] text-[#00ffe0] border-[#00ffe0]">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-500 text-white hover:bg-red-600">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>);
}
