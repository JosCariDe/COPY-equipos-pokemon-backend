import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Pokemon } from '../models/pokemon.model';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

// Decorador que marca esta clase como un servicio inyectable en NestJS
@Injectable()
export class PokemonService {
    private readonly logger = new Logger(PokemonService.name);
    private readonly apiUrl: string = 'https://run.mocky.io/v3/bd844bc2-1b29-4438-854f-e366a3d3b1e8';

    // Constructor que recibe el servicio HTTP mediante inyección de dependencias
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ) {
        this.logger.log(`Servicio iniciado con URL: ${this.apiUrl}`);
    }

    /**
     * Método que obtiene los datos de un Pokémon desde la API externa
     * @returns Promise<Pokemon> - Retorna una promesa con los datos del Pokémon
     * @throws Error - Si hay un error en la petición HTTP
     */
    async obtenerPokemon(): Promise<Pokemon> {
        try {
            this.logger.log('Iniciando petición a la API...');
            // Realiza la petición GET y convierte el Observable a Promise
            const { data } = await firstValueFrom(
                this.httpService.get(this.apiUrl)
            );
            this.logger.log('Datos recibidos de la API');

            // Mapea los datos recibidos a una nueva instancia de la clase Pokemon
            return new Pokemon(
                data.id,                  // ID del Pokémon
                data.nombre,              // Nombre del Pokémon
                data.tipos,              // Array de tipos
                data.nivel,              // Nivel actual
                {
                    // Objeto con las estadísticas
                    hp: data.estadisticas.hp,
                    ataque: data.estadisticas.ataque,
                    defensa: data.estadisticas.defensa,
                    ataque_especial: data.estadisticas.ataque_especial,
                    defensa_especial: data.estadisticas.defensa_especial,
                    velocidad: data.estadisticas.velocidad
                },
                data.movimientos,         // Array de movimientos
                data.sprite              // Agregamos el sprite
            );
        } catch (error) {
            this.logger.error(`Error en la petición: ${error.message}`);
            // Manejo de errores: lanza un nuevo error con un mensaje más descriptivo
            throw new Error(`Error al obtener el Pokémon: ${error.message}`);
        } 
    }    
} 