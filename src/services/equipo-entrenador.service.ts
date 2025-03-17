import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import { firstValueFrom } from "rxjs"
import type { HttpService } from "@nestjs/axios"
import type { DatabaseService } from "../modules/services/database/database.service"

// Interfaces para tipar correctamente
interface IEquipoEntrenador {
  id: string;
  entrenadorId: number;
  equiposIds: string[];
  equipoSeleccionado: string;
}

interface IEquipoEntrenadorDB {
  id: string;
  entrenadorId: number;
  equiposIds: string; // JSON string
  equipoSeleccionado: string;
}

@Injectable()
export class EquipoEntrenadorService {
  private readonly logger = new Logger(EquipoEntrenadorService.name)

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {
    this.logger.log("Servicio de equipos de entrenador inicializado con Azure SQL")
  }

  // TODO: aplicar bien la logica del servicio de entrenador cuando se tenga
  async getEntrenador(id: number): Promise<boolean> {
    try {
      const url = this.configService.get<string>("TRAINERS_SERVICE_URL") || "/unexistent-url"
      const response = await firstValueFrom(this.httpService.get(`${url}/pokemon/${id}`))
      return response.status === 200
    } catch (_error) {
      void _error
      return false
    }
  }

  async crearEquipoEntrenador(entrenadorId: number, equiposIds: string[], equipoSeleccionado: string): Promise<IEquipoEntrenador> {
    try {
      const result = await this.databaseService.execute("sp_CrearEquipoEntrenador", {
        entrenadorId,
        equiposIds: JSON.stringify(equiposIds),
        equipoSeleccionado,
      })

      const equipoEntrenadorId = result.recordset[0].id

      this.logger.log(`EquipoEntrenador creado con ID: ${equipoEntrenadorId} para entrenador: ${entrenadorId}`)

      return {
        id: equipoEntrenadorId,
        entrenadorId,
        equiposIds,
        equipoSeleccionado,
      }
    } catch (error) {
      this.logger.error(`Error al guardar en la base de datos: ${error.message}`)
      throw new HttpException(
        `Error al guardar equipo de entrenador en la base de datos`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async obtenerEquipoEntrenador(equipoEntrenadorId: string): Promise<IEquipoEntrenador> {
    try {
      const equipos = await this.databaseService.query<IEquipoEntrenadorDB>(
        `
                SELECT id, entrenadorId, equiposIds, equipoSeleccionado
                FROM EquiposEntrenador
                WHERE id = @param0
            `,
        [equipoEntrenadorId],
      )

      if (equipos.length === 0) {
        throw new HttpException("Equipo de entrenador no encontrado", HttpStatus.NOT_FOUND)
      }

      const equipo = equipos[0];
      return {
        id: equipo.id,
        entrenadorId: equipo.entrenadorId,
        equiposIds: JSON.parse(equipo.equiposIds),
        equipoSeleccionado: equipo.equipoSeleccionado,
      }
    } catch (error) {
      this.logger.error(`Error al obtener equipo de entrenador: ${error.message}`)
      throw new HttpException(`Error al obtener equipo de entrenador`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async obtenerEquiposPorEntrenador(entrenadorId: number): Promise<IEquipoEntrenador[]> {
    try {
      const equipos = await this.databaseService.query<IEquipoEntrenadorDB>(
        `
                SELECT id, entrenadorId, equiposIds, equipoSeleccionado
                FROM EquiposEntrenador
                WHERE entrenadorId = @param0
            `,
        [entrenadorId],
      )

      if (equipos.length === 0) {
        throw new HttpException("No se encontraron equipos para este entrenador", HttpStatus.NOT_FOUND)
      }

      return equipos.map((equipo) => ({
        id: equipo.id,
        entrenadorId: equipo.entrenadorId,
        equiposIds: JSON.parse(equipo.equiposIds),
        equipoSeleccionado: equipo.equipoSeleccionado,
      }))
    } catch (error) {
      this.logger.error(`Error al obtener equipos por entrenador: ${error.message}`)
      throw new HttpException(`Error al obtener equipos por entrenador`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async actualizarEquipoEntrenador(
    equipoEntrenadorId: string,
    entrenadorId: number,
    equiposIds: string[],
    equipoSeleccionado: string,
  ): Promise<IEquipoEntrenador> {
    try {
      const equipos = await this.databaseService.query(
        `
                SELECT id FROM EquiposEntrenador WHERE id = @param0
            `,
        [equipoEntrenadorId],
      )

      if (equipos.length === 0) {
        throw new HttpException("Equipo de entrenador no encontrado", HttpStatus.NOT_FOUND)
      }

      await this.databaseService.execute("sp_ActualizarEquipoEntrenador", {
        equipoEntrenadorId,
        entrenadorId,
        equiposIds: JSON.stringify(equiposIds),
        equipoSeleccionado,
      })

      this.logger.log(`Equipo de entrenador actualizado con ID: ${equipoEntrenadorId}`)

      return {
        id: equipoEntrenadorId,
        entrenadorId,
        equiposIds,
        equipoSeleccionado,
      }
    } catch (error) {
      this.logger.error(`Error al actualizar equipo de entrenador: ${error.message}`)
      throw new HttpException(`Error al actualizar equipo de entrenador`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async eliminarEquipoEntrenador(equipoEntrenadorId: string): Promise<void> {
    try {
      const equipos = await this.databaseService.query<IEquipoEntrenadorDB>(
        `
                SELECT id, equiposIds FROM EquiposEntrenador WHERE id = @param0
            `,
        [equipoEntrenadorId],
      )

      if (equipos.length === 0) {
        throw new HttpException("Equipo de entrenador no encontrado", HttpStatus.NOT_FOUND)
      }

      const equiposIds: string[] = JSON.parse(equipos[0].equiposIds)

      // Eliminar los equipos asociados
      for (const equipoId of equiposIds) {
        await this.databaseService.execute("sp_EliminarEquipo", { equipoId })
        this.logger.log(`Equipo eliminado con ID: ${equipoId}`)
      }

      // Eliminar el equipo de entrenador
      await this.databaseService.execute("sp_EliminarEquipoEntrenador", { equipoEntrenadorId })

      this.logger.log(`Equipo de entrenador eliminado con ID: ${equipoEntrenadorId}`)
    } catch (error) {
      this.logger.error(`Error al eliminar equipo de entrenador: ${error.message}`)
      throw new HttpException(`Error al eliminar equipo de entrenador`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}

