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
    <nav aria-label="Pagination">
      {pagination.hasPreviousPage ? (
        <Link href={getBlogPaginationUrl(pagination.currentPage - 1, basePath)}>
          {"\u2190"} Previous
        </Link>
      ) : (
        <span aria-disabled="true">{"\u2190"} Previous</span>
      )}
      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span aria-hidden="true" key={`ellipsis-${index}`}>...</span>
        ) : (
          <Link
            aria-current={item === pagination.currentPage ? "page" : undefined}
            aria-label={`Go to page ${item}`}
            href={getBlogPaginationUrl(item, basePath)}
            key={item}
          >
            {item}
          </Link>
        ),
      )}
      {pagination.hasNextPage ? (
        <Link href={getBlogPaginationUrl(pagination.currentPage + 1, basePath)}>
          Next {"\u2192"}
        </Link>
      ) : (
        <span aria-disabled="true">Next {"\u2192"}</span>
      )}
    </nav>
  );
}
