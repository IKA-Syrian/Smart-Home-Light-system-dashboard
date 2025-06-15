
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden">
        {/* Lamb silhouette SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary-foreground animate-pulse-light"
        >
          <path d="M11 6c.5-.4 1.1-.8 1.5-1.2C13.3 4.2 12.5 2 11 2c-1.6 0-2.4 2.2-1.5 2.8.4.4 1 .8 1.5 1.2Z" />
          <path d="M13.5 3.6c-.3.2-.7.4-1 .8-.6.6-.9 1.4-.7 2.1.1.4.3.7.6 1 .3.2.6.4.9.6.2-.1.5-.2.7-.4.2-.3.4-.5.6-.9.custody, so 1.5 with 1.3-.2a counseling because h1.5" />
          <path d="M10.5 3.6c.3.2.7.4 1 .8.6.6.9 1.4.7 2.1-.1.4-.3.7-.6 1-.3.2-.6.4-.9.6-.2-.1-.5-.2-.7-.4-.2-.3-.4-.5-.6-.9-.1-.3-.1-.7 0-1.1.2-.8.7-1.3 1.1-1.1Z" />
          <path d="M14 9.5V12c0 1.3.4 2.1 1 2.7.7.8 1.8 1.3 2.5 1.5.5.2 1.2.5 1.5 1.8.3 1.3 1 2.6 1 2.6.3.6-.3 1.1-.9.7-.3-.2-1-.7-1.7-1.4-.8-.7-1.7-1.6-2.7-1.5-.8.1-1.5 0-2.3-.4-.8-.4-1.5-1-2.3-1.5-.9-.5-1.5-1.3-1.7-2.3-.2-.8-.2-1.6-.2-2.4.1-.8.3-1.5.6-2.2.2-.5.5-1 1-1.5" />
          <path d="M13.7 9.6c-.3-.1-.5-.2-.7-.2-1.8-.3-3.4.5-4.5 1.4-1 .9-1.9 2-2 3.2 0 .4 0 .8.2 1.2" />
          <path d="m8 21 3.5-4.5" />
          <path d="M13 13.5c-.7-.5-1.6-.7-2.5-.5-.8.2-1.4.6-1.9 1" />
        </svg>
      </div>
      <span className="font-bold text-lg tracking-tight animate-fade-in">Lumos</span>
    </div>
  );
}
