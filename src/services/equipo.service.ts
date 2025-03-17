import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common"
import type { HttpService } from "@nestjs/axios"
import { firstValueFrom } from "rxjs"
import type { ConfigService } from "@nestjs/config"
import type { DatabaseService } from "../modules/services/database/database.service"

// Interfaces para tipar correctamente
interface IEquipoPokemon {
  id: string;
  nombre: string;
  pokemonesIds: number[];
}

interface IEquipoPokemonDB {
  id: string;
  nombre: string;
  pokemonesIds: string; // JSON string
}

@Injectable()
export class EquipoService {
  private readonly logger = new Logger(EquipoService.name)

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {
    this.logger.log("Servicio de equipos inicializado con Azure SQL")
  }

  // TODO: aplicar bien la logica del servicio de pokemon cuando se tenga
  async getPokemon(id: number): Promise<boolean> {
    try {
      const url = this.configService.get<string>("POKEMON_SERVICE_URL") || `https://pokeapi.co/api/v2`
      const response = await firstValueFrom(this.httpService.get(`${url}/pokemon/${id}`))
      return response.status === 200
    } catch (_error) {
      void _error
      return false
    }
  }

  async crearEquipo(entrenadorId: string, nombre: string, pokemonIds: number[]): Promise<IEquipoPokemon> {
    try {
      const numericId = Number.parseInt(entrenadorId)
      if (isNaN(numericId)) {
        throw new HttpException("ID de entrenador inválido", HttpStatus.BAD_REQUEST)
      }

      // Verificar límite de 6 Pokemon por equipo
      if (pokemonIds.length > 6) {
        throw new HttpException("Un equipo no puede tener más de 6 Pokemon", HttpStatus.BAD_REQUEST)
      }

      // Verificar que los Pokémon existan
      const pokemonExists = await Promise.all(pokemonIds.map((id) => this.getPokemon(id)))

      if (pokemonExists.some((exists) => !exists)) {
        throw new HttpException("Al menos uno de los Pokémon no existe", HttpStatus.BAD_REQUEST)
      }

      try {
        // Crear el equipo en la base de datos SQL
        const result = await this.databaseService.execute("sp_CrearEquipo", {
          entrenadorId: numericId,
          nombre: nombre.trim(),
          pokemonIds: JSON.stringify(pokemonIds),
        })

        const equipoId = result.recordset[0].id

        this.logger.log(`Equipo creado con ID: ${equipoId} para entrenador: ${entrenadorId}`)

        return {
          id: equipoId,
          nombre: nombre.trim(),
          pokemonesIds: pokemonIds,
        }
      } catch (error) {
        this.logger.error(`Error al guardar en la base de datos: ${error.message}`)
        throw new HttpException(`Error al guardar equipo en la base de datos`, HttpStatus.INTERNAL_SERVER_ERROR)
      }
    } catch (error) {
      this.logger.error(`Error al crear equipo: ${error.message}`)
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(`Error al crear equipo`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async obtenerEquipo(equipoId: string): Promise<IEquipoPokemon> {
    try {
      // Obtener el equipo de la base de datos SQL
      const equipos = await this.databaseService.query<IEquipoPokemonDB>(
        `
        SELECT e.id, e.nombre, e.pokemonesIds
        FROM Equipos e
        WHERE e.id = @param0
      `,
        [equipoId],
      )

      if (equipos.length === 0) {
        throw new HttpException("Equipo no encontrado", HttpStatus.NOT_FOUND)
      }

      const equipo = equipos[0];
      return {
        id: equipo.id,
        nombre: equipo.nombre,
        pokemonesIds: JSON.parse(equipo.pokemonesIds),
      }
    } catch (error) {
      this.logger.error(`Error al obtener equipo: ${error.message}`)
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(`Error al obtener equipo: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async actualizarEquipo(equipoId: string, nombre: string, pokemonIds: number[]): Promise<IEquipoPokemon> {
    try {
      // Verificar cantidad de pokémon
      if (pokemonIds.length > 6) {
        throw new HttpException("Un equipo no puede tener más de 6 Pokémon", HttpStatus.BAD_REQUEST)
      }

      // Verificar que los Pokémon existan
      await Promise.all(pokemonIds.map((id) => this.getPokemon(id)))

      // Verificar que el equipo existe
      const equipos = await this.databaseService.query(
        `
        SELECT id FROM Equipos WHERE id = @param0
      `,
        [equipoId],
      )

      if (equipos.length === 0) {
        throw new HttpException("Equipo no encontrado", HttpStatus.NOT_FOUND)
      }

      // Actualizar el equipo
      await this.databaseService.execute("sp_ActualizarEquipo", {
        equipoId,
        nombre: nombre.trim(),
        pokemonIds: JSON.stringify(pokemonIds),
      })

      this.logger.log(`Equipo actualizado con ID: ${equipoId}`)

      return {
        id: equipoId,
        nombre: nombre.trim(),
        pokemonesIds: pokemonIds,
      }
    } catch (error) {
      this.logger.error(`Error al actualizar equipo: ${error.message}`)
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(`Error al actualizar equipo: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async eliminarEquipo(equipoId: string): Promise<void> {
    try {
      // Verificar que el equipo existe
      const equipos = await this.databaseService.query(
        `
        SELECT id FROM Equipos WHERE id = @param0
      `,
        [equipoId],
      )

      if (equipos.length === 0) {
        throw new HttpException("Equipo no encontrado", HttpStatus.NOT_FOUND)
      }

      // Eliminar el equipo
      await this.databaseService.execute("sp_EliminarEquipo", { equipoId })

      this.logger.log(`Equipo eliminado con ID: ${equipoId}`)
    } catch (error) {
      this.logger.error(`Error al eliminar equipo: ${error.message}`)
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(`Error al eliminar equipo: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}

