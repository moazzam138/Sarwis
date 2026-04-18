import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export const BinLid = ({ isOpen, ...props }: { isOpen: boolean } & SVGProps<SVGSVGElement>) => (
    <div {...props} className={cn("relative w-16 h-16", props.className)}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 text-primary/70">
            <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 7V18C6 19.6569 7.34315 21 9 21H15C16.6569 21 18 19.6569 18 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" 
            className={cn(
                "absolute inset-0 text-primary transition-transform duration-500 ease-in-out",
                "origin-[50%_75%]",
                isOpen ? "rotate-[-110deg] translate-x-[-2px] translate-y-[-2px]" : "rotate-0"
            )}
        >
             <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    </div>
);
