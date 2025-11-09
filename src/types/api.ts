export interface IResponse<
  TCode extends string,
  TData extends unknown
> {
  code: TCode
  status: string
  message: string
  data: TData
}