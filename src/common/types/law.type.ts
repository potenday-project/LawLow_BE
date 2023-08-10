import { SearchTabEnum } from './search.type';

interface Attributes {
  [key: string]: string;
}

interface RawDataEntry {
  _text?: string | number;
  _cdata?: string;
  _attributes?: Attributes;
}

interface RawLawData {
  [key: string]: RawDataEntry;
}

interface LawDetailResponse {
  PrecService?: RawLawData;
  법령?: RawLawData;
}

interface CommonConvertedElement<T> {
  _text: T;
  _cdata?: string;
}
interface ConvertedPrecElement {
  판례일련번호: CommonConvertedElement<number>;
}
interface ConvertedLawElement {
  법령ID: CommonConvertedElement<number>;
}
interface LawListResponse {
  PrecSearch?: {
    totalCnt: CommonConvertedElement<number>;
    prec: ConvertedPrecElement[] | ConvertedPrecElement;
  };
  LawSearch?: {
    totalCnt: CommonConvertedElement<number>;
    law: ConvertedLawElement[] | ConvertedLawElement;
  };
}

interface TransformedDataEntry {
  [key: string]: string | number;
}

interface PrecDetailData {
  id: number;
  searchType: SearchTabEnum;
  incidentTypeName: string;
  adjudicationType: string;
  sentencing: string;
  courtName: string;
  sentencingDate: string;
  title: string;
  content: string;
}

export { LawListResponse, LawDetailResponse, RawLawData, RawDataEntry, TransformedDataEntry, PrecDetailData };
