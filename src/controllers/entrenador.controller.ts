import { Controller, Get, Logger, Param, HttpException, HttpStatus } from "@nestjs/common"
import type { EntrenadorService } from "../services/temporal/entrenador.service"

// NOTA: tanto como el EntrenadorService como este controlador deben ser eliminados cuando ya se tengan los servicios reales
@Controller("api/entrenadores")
export class EntrenadorController {
  private readonly logger = new Logger(EntrenadorController.name)

  constructor(private readonly entrenadorService: EntrenadorService) {}

  @Get()
  obtenerEntrenadores() {
    this.logger.log("Procesando solicitud para obtener entrenadores")
    return this.entrenadorService.obtenerEntrenadores()
  }

  @Get(':id')
    obtenerEntrenadorPorId(@Param('id') id: string) {
        this.logger.log(`Procesando solicitud para obtener entrenador con ID: ${id}`);

        const numericId = Number.parseInt(id, 10);
        if (isNaN(numericId)) {
            throw new HttpException(`ID de Entrenador inválido: ${id}`, HttpStatus.BAD_REQUEST);
        }

        return this.entrenadorService.obtenerEntrenadorPorId(numericId);
    }
}

