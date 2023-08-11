type DataValueType = string | number | object;
export interface CommonResponse {
  success: boolean;
  data?: DataValueType;
  [key: string]: DataValueType | boolean;
  statusCode?: number;
  errorMessage?: string;
  errorDetail?: string;
}

export interface SuccessResponse {
  success: boolean;
  data?: DataValueType;
  [key: string]: DataValueType | boolean;
}

export interface FailResponse {
  success: boolean;
  statusCode: number;
  message: string;
  detail: string;
}
