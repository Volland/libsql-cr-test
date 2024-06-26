import { DataStoreService } from "./data-store-service"

async function main() {
const datastore = new DataStoreService()
    const createResult = await datastore.execute('create table foo (a primary key NOT NULL, b);')
    if (datastore.useCrSql) {
      const crConvertResult = await datastore.execute(`select crsql_as_crr('foo');`)
      console.log(crConvertResult)

      const tableResult = await datastore.query(
        `SELECT name FROM sqlite_master WHERE type='table'and  name in ('foo__crsql_clock', 'foo__crsql_pks');`
      )
      console.log(tableResult.data.includes(['foo__crsql_clock']) ? "CR works " : "CR not works ")
    }
}
main().then(() => console.log('done'))