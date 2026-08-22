import {
  generateBlogPaginationItems,
  getBlogPaginationUrl,
  type BlogPagination as BlogPaginationData,
} from "@/lib/blog-index";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function BlogPagination({
  basePath,
  pagination,
}: {
  basePath?: string;
  pagination: BlogPaginationData;
}) {
  if (pagination.totalPages <= 1) return null;
  const items = generateBlogPaginationItems(
    pagination.currentPage,
    pagination.totalPages,
  );
  const buttonClass =
    "inline-flex min-h-9 min-w-10 items-center justify-center rounded-control border border-border bg-card px-4 text-sm font-semibold leading-none text-card-foreground transition-colors motion-fast hover:bg-background";

  return (
    <nav aria-label="Pagination" className="mt-14 flex flex-wrap items-center justify-center gap-2">
      {pagination.hasPreviousPage ? (
        <Link className={buttonClass} href={getBlogPaginationUrl(pagination.currentPage - 1, basePath)}>
          {"\u2190"} Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(buttonClass, "opacity-40")}>{"\u2190"} Previous</span>
      )}
      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span aria-hidden="true" className="inline-flex min-h-9 min-w-10 items-center justify-center text-muted-foreground" key={`ellipsis-${index}`}>...</span>
        ) : (
          <Link
            aria-current={item === pagination.currentPage ? "page" : undefined}
            aria-label={`Go to page ${item}`}
            className={cn(buttonClass, "px-0", item === pagination.currentPage && "border-primary bg-primary text-primary-foreground hover:bg-primary/90")}
            href={getBlogPaginationUrl(item, basePath)}
            key={item}
          >
            {item}
          </Link>
        ),
      )}
      {pagination.hasNextPage ? (
        <Link className={buttonClass} href={getBlogPaginationUrl(pagination.currentPage + 1, basePath)}>
          Next {"\u2192"}
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(buttonClass, "opacity-40")}>Next {"\u2192"}</span>
      )}
    </nav>
  );
}
