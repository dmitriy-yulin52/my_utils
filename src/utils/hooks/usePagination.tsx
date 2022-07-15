import { useCallback, useEffect, useState } from 'react';

function usePagination<T>(items: Array<T>, defaultPageSize?: number, defaultCurrentPage?: number) {
  const [currentPage, setCurrentPage] = useState(defaultCurrentPage || 1);
  const [pageSize, setPageSize] = useState(defaultPageSize || 5);

  useEffect(() => {
    if (items.length < pageSize) {
      setCurrentPage(1);
    }
  }, [items, pageSize]);

  const handleChangePage = useCallback((event:any, value:number) => {
    setCurrentPage(value);
  }, []);

  const handleChangePageSize = useCallback((event:any) => {
    setPageSize(parseInt(event.target.value, 10));
    setCurrentPage(1);
  }, []);

  const itemsListCrop = items.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize);

  return { itemsListCrop, currentPage, pageSize, handleChangePage, handleChangePageSize } as const;
}

export default usePagination;