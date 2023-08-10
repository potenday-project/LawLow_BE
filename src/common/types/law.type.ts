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
  [key: string]: string | number | TransformedDataEntry[] | TransformedDataEntry;
}

interface PrecDetailData {
  id: number;
  searchType: SearchTabEnum;
  incidentTypeName: string;
  incidentNumber: string;
  adjudicationType: string;
  sentencing: string;
  courtName: string;
  sentencingDate: string;
  title: string;
  content: string;
}

interface PrecLawData extends TransformedDataEntry {
  판례정보일련번호: number;
  사건번호: string;
  사건종류명: string;
  판결유형: string;
  선고: string;
  법원명: string;
  선고일자: string;
  사건명: string;
  판례내용: string;
}

type TransformedLawList = (TransformedDataEntry | TransformedDataEntry[])[];
type ResLawData = TransformedLawList | PrecDetailData[];

export {
  LawListResponse,
  LawDetailResponse,
  RawLawData,
  RawDataEntry,
  TransformedDataEntry,
  PrecDetailData,
  ResLawData,
  PrecLawData,
  TransformedLawList,
};
