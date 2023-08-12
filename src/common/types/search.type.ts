// Client Request
export enum SearchTabEnum {
  PRECEDENT = 'prec',
  STATUTE = 'statute',
}
export enum SearchRangeEnum {
  TITLE = 1,
  CONTENT = 2,
}
export interface SearchRequest {
  q: string;
  page: number;
  take: number;
}

// Client Response -> ex) PageResponse<SearchResponse[]>;
export interface SearchResponse {
  id: number;
  title: string;
  content: string;
  type: SearchTabEnum;
}

// Server Request
export interface SearchParams {
  OC: string;
  target: SearchTabEnum;
  type: string;
}
