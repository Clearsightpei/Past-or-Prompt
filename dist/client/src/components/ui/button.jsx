var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffe0] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
    variants: {
        variant: {
            default: "bg-transparent text-[#00ffe0] border-none hover:bg-[#00ffe0]/10",
            destructive: "bg-transparent text-destructive-foreground border-destructive hover:bg-destructive/10 border-2 border-destructive",
            outline: "border-2 border-[#00ffe0] text-[#00ffe0] bg-transparent hover:bg-[#00ffe0]/10",
            secondary: "bg-transparent text-secondary-foreground border-secondary hover:bg-secondary/10 border-2 border-secondary",
            ghost: "bg-transparent text-[#00ffe0] hover:bg-[#00ffe0]/10",
            link: "text-[#00ffe0] underline-offset-4 hover:underline bg-transparent",
        },
        size: {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
});
export function Button(_a) {
    var className = _a.className, _b = _a.variant, variant = _b === void 0 ? "default" : _b, _c = _a.asChild, asChild = _c === void 0 ? false : _c, props = __rest(_a, ["className", "variant", "asChild"]);
    var Comp = asChild ? Slot : "button";
    return (<Comp className={cn(buttonVariants({ variant: variant, className: className }))} {...props}/>);
}
Button.displayName = "Button";
export { buttonVariants };
