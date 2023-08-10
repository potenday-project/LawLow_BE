export interface PageResponse<T> {
  list: T;
  first: boolean;
  last: boolean;
  currentElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
  currentPage: number;
}
