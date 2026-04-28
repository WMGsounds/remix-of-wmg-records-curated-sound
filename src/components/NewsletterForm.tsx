import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const NewsletterForm = ({ compact = false }: { compact?: boolean }) => {
  const [email, setEmail] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Welcome to the list", { description: "We'll be in touch with first access." });
    setEmail("");
  };

  return (
    <form
      onSubmit={onSubmit}
      className={`flex items-center border-b border-foreground ${compact ? "max-w-md" : "max-w-xl"} w-full`}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 bg-transparent py-4 text-base focus:outline-none placeholder:text-muted-foreground/70"
      />
      <button
        type="submit"
        aria-label="Subscribe"
        className="p-3 -mr-3 hover:text-accent transition-colors duration-500"
      >
        <ArrowRight className="h-5 w-5" />
      </button>
    </form>
  );
};
