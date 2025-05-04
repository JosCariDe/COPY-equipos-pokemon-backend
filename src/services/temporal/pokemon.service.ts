import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';

/*
    simula el servicio que tendremos de pokemones
 */
@Injectable()
export class PokemonService {
    private readonly logger = new Logger(PokemonService.name);
    private pokemones: any[] = [];

    constructor(
        private readonly httpService: HttpService
    ) {
        //const url="https://run.mocky.io/v3/23d52f40-b336-4a7b-a2ee-c6f58d3c8b0e"
        const url="https://run.mocky.io/v3/8d17233e-5612-4603-93f6-482235ad0a2e"
        // Cargar los Pokemon al iniciar el servicio
        this.cargarPokemonesLocal();
    }

    private cargarPokemonesLocal(): void {
        try {
            // Ruta absoluta desde la raíz del proyecto (no desde dist/)
            const filePath = path.resolve(process.cwd(), 'src', 'services', 'temporal', 'pokemones.json');
            const rawData = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(rawData);

            if (!data || !Array.isArray(data.pokemones)) {
                throw new Error('Formato de archivo inválido');
            }

            this.pokemones = data.pokemones;
            this.logger.log(`${this.pokemones.length} Pokemones cargados correctamente desde archivo local`);
        } catch (error) {
            this.logger.error('Error al leer el archivo de Pokemones:', error.message);
            throw new HttpException(
                'No se pudo cargar la base de datos local de Pokemones',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
    
    private async cargarPokemones(url: string): Promise<void> {
        try {
            const { data } = await firstValueFrom(
                this.httpService.get(url)
            );

            if (!data || !data.pokemones || !Array.isArray(data.pokemones)) {
                throw new Error('Formato de respuesta inválido');
            }

            this.pokemones = data.pokemones;

            this.logger.log(`${this.pokemones.length} Pokemon cargados correctamente`);
        } catch (error) {
            this.logger.error('Error al cargar Pokemon:', error);
            throw new HttpException(
                'Error al cargar la base de datos de Pokemon',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    obtenerPokemones(): { pokemones: any[] } {
        return { pokemones: this.pokemones };
    }

    obtenerPokemonPorId(id: number): any {
        const pokemon = this.pokemones.find(p => p.id === id);

        if (!pokemon) {
            throw new HttpException(
                `Pokemon con ID ${id} no encontrado`,
                HttpStatus.NOT_FOUND
            );
        }

        return pokemon;
    }
}