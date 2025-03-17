import { Injectable, Logger, type OnModuleInit } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import { ConnectionPool } from "mssql"

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name)
  private pool: ConnectionPool

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log("Initializing Database module...")
    try {
      await this.connect()
      this.logger.log("✅ Connected to Azure SQL Database")
    } catch (error) {
      this.logger.error(`❌ Error connecting to database: ${error.message}`, error.stack)
      throw error
    }
  }

  private async connect(): Promise<void> {
    try {
      const config = {
        user: this.configService.get<string>("DB_USER"),
        password: this.configService.get<string>("DB_PASSWORD"),
        server: this.configService.get<string>("DB_SERVER"),
        database: this.configService.get<string>("DB_NAME"),
        options: {
          encrypt: true, // For Azure SQL
          trustServerCertificate: false,
        },
      }

      this.pool = await new ConnectionPool(config).connect()
      this.logger.log(`Connected to database: ${config.database} on ${config.server}`)
    } catch (error) {
      this.logger.error(`Failed to connect to database: ${error.message}`)
      throw error
    }
  }

  async query<T>(query: string, params: any[] = []): Promise<T[]> {
    try {
      const request = this.pool.request()

      // Add parameters to the request
      params.forEach((param, index) => {
        request.input(`param${index}`, param)
      })

      const result = await request.query(query)
      return result.recordset as T[]
    } catch (error) {
      this.logger.error(`Query error: ${error.message}`)
      throw error
    }
  }

  async execute(procedure: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const request = this.pool.request()

      // Add parameters to the request
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value)
      })

      const result = await request.execute(procedure)
      return result
    } catch (error) {
      this.logger.error(`Stored procedure error: ${error.message}`)
      throw error
    }
  }

  getPool(): ConnectionPool {
    return this.pool
  }
}

