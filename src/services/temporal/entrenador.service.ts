import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Simula el servicio de entrenadores
 */
@Injectable()
export class EntrenadorService {
    private readonly logger = new Logger(EntrenadorService.name);
    private entrenadores: any[] = [];

    constructor(private readonly httpService: HttpService) {
        const url = 'https://run.mocky.io/v3/c15cfc4d-957e-4956-ad8d-179c0ef688c5'
        // Cargar los entrenadores al iniciar el servicio
        this.cargarEntrenadores(url);
    }

    private async cargarEntrenadores(url: string): Promise<void> {
        try {
            const { data } = await firstValueFrom(this.httpService.get(url));

            if (!data || !data.trainers || !Array.isArray(data.trainers)) {
                throw new Error('Formato de respuesta inválido');
            }

            this.entrenadores = data.trainers;

            this.logger.log(`${this.entrenadores.length} entrenadores cargados correctamente`);
        } catch (error) {
            this.logger.error('Error al cargar entrenadores:', error);
            throw new HttpException(
                'Error al cargar la base de datos de entrenadores',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    obtenerEntrenadores(): { entrenadores: any[] } {
        return { entrenadores: this.entrenadores };
    }

    obtenerEntrenadorPorId(id: number): any {
        const entrenador = this.entrenadores.find(e => e.id == id);

        if (!entrenador) {
            throw new HttpException(
                `Entrenador con ID ${id} no encontrado`,
                HttpStatus.NOT_FOUND
            );
        }

        return entrenador;
    }
}
