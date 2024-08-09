import { DataStoreService } from "./data-store-service.ts"

async function main() {
const datastore = new DataStoreService()
    const createResult = await datastore.execute(`create table if not exists conversation (
            id varchar(36) primary key not null,
            startDate real,
            endDate real,
            summary text,
            vectorSummary F32_BLOB(1536)
          );`)

    
          const createIndex = await datastore.execute(
            `CREATE INDEX idx_conversation_vectorSummary ON conversation (libsql_vector_idx(vectorSummary));`
          )
          if (!createIndex.isOk) {
            this.toFail(createIndex, 'create index failure', true)
          }
    if (datastore.useCrSql) {
      const crConvertResult = await datastore.execute(`select crsql_as_crr('conversation');`)
      console.log(crConvertResult)


      const tableResult = await datastore.query(
        `SELECT name FROM sqlite_master WHERE type='table'and  name in ('conversation__crsql_clock', 'conversation__crsql_pks');`
      )
      console.log(tableResult)
      console.log(tableResult.data[0].includes('foo__crsql_clock') ? "CR works " : "CR not works ")
    }
}
main().then(() => console.log('done'))