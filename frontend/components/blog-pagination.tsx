import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { buttonVariants } from "@/components/ui/button";
import {
  generateBlogPaginationItems,
  getBlogPaginationUrl,
  type BlogPagination as BlogPaginationData,
} from "@/lib/blog-index";
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

  return (
    <Pagination className="mt-10" aria-label="Pagination">
      <PaginationContent className="flex-wrap">
        <PaginationItem>
          {pagination.hasPreviousPage ? (
            <Link
              className={buttonVariants({ variant: "ghost" })}
              href={getBlogPaginationUrl(pagination.currentPage - 1, basePath)}
            >
              {"\u2190"} Previous
            </Link>
          ) : (
            <span
              className="inline-flex h-9 items-center px-4 text-sm text-muted-foreground"
              aria-disabled="true"
            >
              {"\u2190"} Previous
            </span>
          )}
        </PaginationItem>
        {items.map((item, index) =>
          item === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <Link
                className={buttonVariants({
                  variant:
                    item === pagination.currentPage ? "outline" : "ghost",
                  size: "icon",
                })}
                aria-current={
                  item === pagination.currentPage ? "page" : undefined
                }
                aria-label={`Go to page ${item}`}
                href={getBlogPaginationUrl(item, basePath)}
                key={item}
              >
                {item}
              </Link>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          {pagination.hasNextPage ? (
            <Link
              className={buttonVariants({ variant: "ghost" })}
              href={getBlogPaginationUrl(pagination.currentPage + 1, basePath)}
            >
              Next {"\u2192"}
            </Link>
          ) : (
            <span
              className="inline-flex h-9 items-center px-4 text-sm text-muted-foreground"
              aria-disabled="true"
            >
              Next {"\u2192"}
            </span>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
