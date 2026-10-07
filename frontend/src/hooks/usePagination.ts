import { useMemo, useState } from "react";

export function usePagination(initialPageSize = 8) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  return useMemo(
    () => ({
      page,
      pageSize,
      setPage,
      setPageSize,
      tablePagination: {
        current: page,
        pageSize,
        showSizeChanger: true,
        onChange: (nextPage: number, nextPageSize: number) => {
          setPage(nextPage);
          setPageSize(nextPageSize);
        }
      }
    }),
    [page, pageSize]
  );
}

