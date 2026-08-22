import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

describe("DropdownMenuContent", () => {
  it("renders above the sticky site header stacking context", () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Toggle</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Light</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(screen.getByRole("menu")).toHaveClass("z-[70]");
  });
});
