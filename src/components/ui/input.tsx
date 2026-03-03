import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border-2 border-foreground bg-background px-3 py-2 text-base shadow-[2px_2px_0px_hsl(var(--foreground))] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:shadow-[4px_4px_0px_hsl(var(--foreground))] focus-visible:translate-x-[-1px] focus-visible:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-150",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
