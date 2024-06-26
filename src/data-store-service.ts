//@ts-ignore
// @ts-nocheck
// eslint-disable-next-line import/no-extraneous-dependencies
import { dirname, join } from 'path'
import Database from 'libsql'
import { BatchQueryOptions, DataQuery, DataQueryResult, IDataStore, StoreOptions, UpdateCallbackParams } from './types'
import { runOnce } from './helpers/run-once'


const extensionPath = join(dirname(require.resolve('@vlcn.io/crsqlite')), 'dist', 'crsqlite')
export class DataStoreService implements IDataStore {
  private _db

  private _isOpen = false

  private _path: string

  private _ensureOpen: () => Promise<void>

  private _options: StoreOptions

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  updateHook(tableList: string[], callback: (params: UpdateCallbackParams) => Promise<void>): void {
    // TODO : https://linear.app/hyphenxyz/issue/ENG-874/update-hook-for-better-sqlite-wrapper-implementation
    throw new Error('Not implemented ')
  }

  constructor(
    path = ':memory:',
    options: StoreOptions = {
      deviceNumber: 1,
      vectorDimension: 1536,
      vectorType: 'F32',
      dataSyncInterval: 360000,
      dataSyncThreshold: 360000,
      dataAutoSync: false,
      failOnErrors: false,
      reportErrors: true,
    }
  ) {
    this._path = path
    this._options = options
    this._ensureOpen = runOnce(async () => {
      this.open(this._path)
    })
  }

  getVectorOption() {
    return {
      dimension: this._options.vectorDimension,
      type: this._options.vectorType,
    }
  }

  public useCrSql = true

  async query(query: string, params?: any[] | undefined): Promise<DataQueryResult> {
    await this._ensureOpen()
    try {
      const statement = this._db.prepare(query)
      statement.raw(true)
      const paramsWithCorrectTypes = params?.map((param) => {
        if (param === undefined || param === null) {
          return null
        }
        if (param === true) {
          return 1
        }
        if (param === false) {
          return 0
        }
        return param
      })
      // console.log('>>>query ', query, paramsWithCorrectTypes)
      const data = params ? statement.all(paramsWithCorrectTypes) : statement.all()
      // const dataSanitized = data.map((row) => row.map((column) => (column === 'NULL' ? null : column)))
      return {
        isOk: true,
        data,
      }
    } catch (e) {
      return {
        isOk: false,
        data: [],
        errorCode: e.code || 'N/A',
        error: e.message,
      }
    }
  }

  async execute(query: string, params?: any[] | undefined): Promise<DataQueryResult> {
    await this._ensureOpen()
    try {
      const statement = this._db.prepare(query)
      // convert undefined to null
      const paramsWithCorrectTypes = params?.map((param) => {
        if (param === undefined || param === null) {
          return null
        }
        if (param === true) {
          return 1
        }
        if (param === false) {
          return 0
        }
        return param
      })
      // console.log('exec before', query, paramsWithCorrectTypes)
      const data = params ? statement.run(paramsWithCorrectTypes) : statement.run()
      // console.log('exec after', data)
      return {
        isOk: true,
        data,
      }
    } catch (e) {
    console.log(e)
      return {
        isOk: false,
        data: [],
        errorCode: e.code || 'N/A',
        error: e.message,
      }
    }
  }

  async executeInTransaction(query: string, params?: any[] | undefined): Promise<DataQueryResult> {
    await this._ensureOpen()
    const tx = this._db.transaction(() => {
      return this.execute(query, params)
    })
    return tx()
  }

  executeBatch(queries: DataQuery[], options?: BatchQueryOptions): Promise<DataQueryResult[]> {
    const _runner = async () => {
      const results: DataQueryResult[] = []
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < queries.length; i++) {
        const { query, params } = queries[i]
        // eslint-disable-next-line no-await-in-loop
        results.push(await this.execute(query, params))
      }
      return results
    }
    if (options && options.inTransaction) {
      const tx = this._db.transaction(() => _runner())
      return tx()
    }
    return _runner()
  }

  async open(location: string): Promise<boolean> {
    try {
      if (this._isOpen && location === this._path) {
        return true
      }
      if (this._isOpen && location !== this._path) {
        await this.close()
        this._isOpen = false
      }
      this._path = location
      this._db = new Database(this._path)
      this._db.loadExtension(extensionPath)
      this._isOpen = true
      return true
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("couldn't open db", e)
      return false
    }
  }

  async isOpen(): Promise<boolean> {
    return Promise.resolve(this._isOpen)
  }

  async close(): Promise<boolean> {
    if (this.useCrSql) {
      this._db.execute(`select crsql_finalize();`)
    }
    this._db.close()
    this._isOpen = false
    return Promise.resolve(true)
  }
}
