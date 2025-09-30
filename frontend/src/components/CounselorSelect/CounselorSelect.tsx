// components/CounselorSelect.tsx

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronsUpDown, Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Counselor = {
  id: string;
  name: string;
  type: "Psychologist" | "Therapist" | "Counselor";
  isOnline: boolean;
  rating: number;
  totalSessions: number;
  bio: string;
  specializations: string[];
  avatar_url?: string;
};

type Props = {
  counselors: Counselor[];
  value: string | null;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
};

export function CounselorSelect({
  counselors,
  value,
  onChange,
  placeholder = "Select counselor...",
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const selected = counselors.find(c => c.id === value) || null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between rounded-xl", className)}
        >
          {selected ? (
            <div className="flex items-center gap-3 truncate">
              <Avatar className="h-6 w-6">
                {selected.avatar_url ? (
                  <AvatarImage src={selected.avatar_url} alt={selected.name} />
                ) : null}
                <AvatarFallback>{selected.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <span className="truncate">{selected.name}</span>
              <span className="text-xs text-muted-foreground">• {selected.type}</span>
              <span className="inline-flex items-center text-xs text-amber-600 ml-1">
                <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                {selected.rating}
              </span>
              {selected.isOnline && <Badge className="text-xs bg-green-600 ml-1">Online</Badge>}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command filter={(v, s) => {
          // default filter matches label string; we’ll keep it simple:
          return s.toLowerCase().includes(v.toLowerCase()) ? 1 : 0;
        }}>
          <CommandInput placeholder="Search counselors..." />
          <CommandEmpty>No counselors found.</CommandEmpty>
          <CommandList>
            <ScrollArea className="max-h-72">
              <CommandGroup>
                {counselors.map((c) => {
                  const label = `${c.name} ${c.type} ${c.specializations.join(" ")} ${c.rating}`;
                  return (
                    <CommandItem
                      key={c.id}
                      value={label}
                      onSelect={() => {
                        onChange(c.id);
                        setOpen(false);
                      }}
                      className="px-2 py-2"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-8 w-8">
                          {c.avatar_url ? <AvatarImage src={c.avatar_url} alt={c.name} /> : null}
                          <AvatarFallback>{c.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{c.name}</span>
                            <Badge variant="outline" className="text-[10px]">{c.type}</Badge>
                            {c.isOnline && <Badge className="text-[10px] bg-green-600">Online</Badge>}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center">
                              <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                              {c.rating} • {c.totalSessions} sessions
                            </span>
                            <span className="truncate">• {c.specializations.slice(0, 2).join(", ")}</span>
                          </div>
                        </div>
                      </div>
                      <Check className={cn("ml-2 h-4 w-4 opacity-0", value === c.id && "opacity-100")} />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
