import * as React from "react";
import { X, Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface MultiSelectOption {
  value: string;
  label: string;
  category?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  maxItemsMessage?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  showCategories?: boolean;
  warnAfter?: number;
  warnMessage?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  maxItems,
  maxItemsMessage,
  searchPlaceholder = "Search...",
  emptyMessage = "No items found.",
  className,
  showCategories = true,
  warnAfter,
  warnMessage,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      if (maxItems && selected.length >= maxItems) {
        return;
      }
      onChange([...selected, value]);
    }
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(selected.filter((item) => item !== value));
  };

  // Group options by category
  const groupedOptions = React.useMemo(() => {
    if (!showCategories) {
      return { "All": options };
    }
    return options.reduce((acc, option) => {
      const category = option.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(option);
      return acc;
    }, {} as Record<string, MultiSelectOption[]>);
  }, [options, showCategories]);

  // Filter options based on search
  const filteredGroups = React.useMemo(() => {
    if (!searchQuery) return groupedOptions;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, MultiSelectOption[]> = {};

    Object.entries(groupedOptions).forEach(([category, opts]) => {
      const matchingOpts = opts.filter(
        (opt) =>
          opt.label.toLowerCase().includes(query) ||
          opt.value.toLowerCase().includes(query)
      );
      if (matchingOpts.length > 0) {
        filtered[category] = matchingOpts;
      }
    });

    return filtered;
  }, [groupedOptions, searchQuery]);

  const hasResults = Object.values(filteredGroups).some((arr) => arr.length > 0);

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between min-h-[42px] h-auto",
              selected.length === 0 && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <span className="truncate">
              {selected.length === 0
                ? placeholder
                : `${selected.length} selected`}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-zinc-900 border border-zinc-700 shadow-lg" align="start" style={{ width: "var(--radix-popover-trigger-width)" }}>
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="h-4 w-4 shrink-0 opacity-50 mr-2" />
              <input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <CommandList className="max-h-[300px] overflow-auto">
              {!hasResults && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </div>
              )}
              {Object.entries(filteredGroups).map(([category, opts]) => (
                <CommandGroup key={category} heading={showCategories ? category : undefined}>
                  {opts.map((option) => {
                    const isSelected = selected.includes(option.value);
                    const isDisabled = !isSelected && maxItems && selected.length >= maxItems;

                    return (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => handleSelect(option.value)}
                        className={cn(
                          "cursor-pointer",
                          isDisabled && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={isDisabled}
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible"
                          )}
                        >
                          <Check className="h-3 w-3" />
                        </div>
                        <span>{option.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
            {maxItems && (
              <div className="border-t p-2">
                <p className="text-xs text-muted-foreground text-center">
                  {maxItemsMessage || `You can select up to ${maxItems} items`}
                </p>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected items as chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((value) => {
            const option = options.find((opt) => opt.value === value);
            return (
              <Badge
                key={value}
                variant="secondary"
                className="pl-2 pr-1 py-1 text-sm flex items-center gap-1 animate-in fade-in-0 zoom-in-95"
              >
                {option?.label || value}
                <button
                  type="button"
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                  onClick={(e) => handleRemove(value, e)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Warning for too many selections */}
      {warnAfter && selected.length > warnAfter && warnMessage && (
        <p className="text-xs text-amber-600 animate-in fade-in-0">
          {warnMessage}
        </p>
      )}
    </div>
  );
}
