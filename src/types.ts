export type IndexQuery = {
  index: string
  vector: number[]
  top?: number
  maxDistance?: number
  k?: number
  ef?: number
}
export type IndexResultItem = [id: string, distance: number]

export type IndexQueryResult = {
  isOk: boolean
  data: IndexResultItem[]
  errorCode?: string
  error?: string
}
export type vectorValueType = 'F32' | 'F64'

export interface IClosable {
  open: (location: string) => Promise<boolean>
  isOpen: () => Promise<boolean>
  close: () => Promise<boolean>
}

export type DataQueryResult = {
  isOk: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[][]
  errorCode?: string
  error?: string
}
export type DataQuery = {
  query: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[]
}
export type BatchQueryOptions = {
  inTransaction: boolean
  parallel: boolean
}
export type UpdateCallbackParams = {
  table: string
  rowId: number
  id?: string
  operation?: 'I' | 'U' | 'D' | undefined
}

export interface IDataStoreQueryable {
  query: (query: string, params?: any[] | undefined) => Promise<DataQueryResult>
  execute: (query: string, params?: any[] | undefined) => Promise<DataQueryResult>
  executeInTransaction: (query: string, params?: any[] | undefined) => Promise<DataQueryResult>
  executeBatch: (queries: DataQuery[], options?: BatchQueryOptions) => Promise<DataQueryResult[]>
  updateHook: (tableList: string[], callback: (params: UpdateCallbackParams) => Promise<void>) => void
  useCrSql: boolean
  getVectorOption: () => { dimension: number; type: vectorValueType }
}

export interface IDataStore extends IDataStoreQueryable, IClosable {}

export interface IDataStoreSynchronizable {
  startDataSync: () => Promise<boolean>
  stopDataSync: () => Promise<boolean>
}

export type StoreOptions = {
  deviceNumber: number
  vectorDimension: number
  vectorType: vectorValueType
  dataSyncInterval: number
  dataSyncThreshold: number
  dataAutoSync: boolean
  failOnErrors: boolean
  reportErrors: boolean
}

export interface IStoreService extends IDataStoreQueryable, IDataStoreSynchronizable {
  close: () => Promise<boolean>
  toFail: (result: DataQueryResult | IndexQueryResult, message?: string, fail?: boolean, log?: boolean) => void
  toVector(vector: number[]): Float32Array | Float64Array
  nextSequence(table: string): Promise<number>
}
