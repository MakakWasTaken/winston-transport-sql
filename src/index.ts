import { Knex } from 'knex'
import { DateTime } from 'luxon'
import Transport from 'winston-transport'

export interface SQLTransportOptions {
  client: Knex<any, unknown[]>
  tableName?: string
  level?: Transport.TransportStreamOptions['level']
  namingOptions: SQLNamingOptions
}

export interface SQLNamingOptions {
  timestamp?: string
  level?: string
  message?: string
  meta?: string
}

/**
 * A Winston transport that logs to a SQL database.
 */
export class SQLTransport extends Transport {
  tableName: string
  client: Knex<any, unknown[]>

  constructor(opts: SQLTransportOptions) {
    super()
    this.client = opts.client
    this.tableName = opts.tableName || 'WinstonLogs'
    this.level = opts.level

    this.init()
  }

  /**
   * Create logs table.
   * @return {Promise} result of creation within a Promise
   */
  async init(): Promise<any> {
    const exists = await this.client.schema.hasTable(this.tableName)
    if (!exists) {
      console.log(`Creating table ${this.tableName}`)
      this.client.schema.createTable(this.tableName, (table) => {
        table.increments()
        table.string('level')
        table.string('message')
        table.string('meta')
        table.timestamp('timestamp').defaultTo(this.client.fn.now())
        console.log('Structured table')
      })
    }
    return exists
  }

  end(): any {
    this.client.destroy()
  }

  /**
   * Flush all logs
   * Return a Promise which resolves when all logs are finished.
   * @return {Promise} result within a Promise
   */
  flush(): Promise<any> {
    return this.client.from(this.tableName).del()
  }

  async log(info: any, callback: (err?: any) => void) {
    setImmediate(() => {
      this.emit('logged', info)
    })

    const { level, message, ...meta } = info

    const log = {
      level,
      message,
      meta: JSON.stringify(meta),
      timestamp: DateTime.utc().toJSDate(),
    }

    const queryBuilder = this.client(this.tableName)

    try {
      await queryBuilder.insert(log)

      callback()
    } catch (err) {
      callback(err)
    }
  }
}

export default SQLTransport
