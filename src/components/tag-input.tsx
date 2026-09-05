"use client";

import { Input } from "@/components/ui/input";

/**
 * Tags are a comma-separated line rather than a chip editor. They are short,
 * rarely edited, and both content backends take a plain array — a richer control
 * would be more code for no more capability.
 */
export function TagInput({
  id,
  value,
  onChange,
  placeholder = "rag, agents, retrieval",
  disabled,
}: {
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Input
      id={id}
      value={value.join(", ")}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) =>
        onChange(
          event.target.value
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        )
      }
    />
  );
}
