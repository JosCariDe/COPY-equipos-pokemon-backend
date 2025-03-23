import { Injectable, Logger, HttpException, HttpStatus, Inject } from "@nestjs/common"
import { HttpService } from "@nestjs/axios"
import { firstValueFrom } from "rxjs"
import { EquipoPokemon, ToSaveEquipoPokemon } from "../models/equipo.model"
import { FirebaseService } from "../modules/services/firebase/firebase.service"
import {
  collection,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  type Firestore,
  addDoc,
  query,
  getDocs,
  where,
} from "firebase/firestore"
import { ConfigService } from "@nestjs/config"

@Injectable()
export class EquipoService {
  private readonly logger = new Logger(EquipoService.name)
  private readonly db: Firestore
  private readonly equiposCollection = "equipos-pokemon"
  private readonly equiposEntrenadorCollection = "equipos-entrenador";

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(FirebaseService)
    private readonly firebaseService: FirebaseService,
  ) {
    this.db = this.firebaseService.getFirestoreInstance()
    this.logger.log("Servicio de equipos inicializado con Firestore")
  }

  // TODO: aplicar bien la logica del servicio de pokemon cuando se tenga
  async getPokemon(id: number): Promise<boolean> {
    try {
      const url = this.configService.get<string>("POKEMON_SERVICE_URL") || `https://pokeapi.co/api/v2`;
      const response = await firstValueFrom(this.httpService.get(`${url}/pokemon/${id}`));
      return response.status === 200;
    } catch (_error) {
      void _error;
      return false;
    }
  }

  async crearEquipo(entrenadorId: string, nombre: string, pokemonIds: number[]): Promise<any> {
    try {
      const numericId = Number.parseInt(entrenadorId) //asumiendo que la id de entrenador es un número
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
        // Crear el documento en Firestore
        const equipoRef = collection(this.db, this.equiposCollection)
        const equipoData = new ToSaveEquipoPokemon(
          String(nombre).trim(),
          pokemonIds.map(id => Number(id)),
        )
        const docRef = await addDoc(equipoRef, equipoData.getSaveJson())
        this.logger.log(`Equipo creado con ID: ${docRef.id} para entrenador: ${entrenadorId}`)
        // añadir el equipo al entrenador
        const q = query(collection(this.db, this.equiposEntrenadorCollection), where("entrenadorId", "==", entrenadorId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const entrenadorDoc = querySnapshot.docs[0]; // Asumimos que hay solo un entrenador con este ID
          const equiposActualizados = [...entrenadorDoc.data().equiposIds, docRef.id];

          await updateDoc(doc(this.db, this.equiposEntrenadorCollection, entrenadorDoc.id), {
            equiposIds: equiposActualizados
          });

        } else {
          throw new HttpException("Entrenador no encontrado", HttpStatus.NOT_FOUND);
        }

        const equipo = new EquipoPokemon(docRef.id, String(nombre).trim(), pokemonIds.map(id => Number(id)))
        return equipo.toJSON()
      } catch (error) {
        this.logger.error(`Error al guardar en Firestore: ${error.message}`)
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

  async obtenerEquipo(equipoId: string): Promise<any> {
    try {

      // Obtener el equipo de Firestore
      const equipoRef = doc(this.db, this.equiposCollection, equipoId)
      const equipoDoc = await getDoc(equipoRef)
      if (!equipoDoc.exists()) {
        throw new HttpException("Equipo no encontrado", HttpStatus.NOT_FOUND)
      }

      return new EquipoPokemon(equipoId, equipoDoc.data().nombre, equipoDoc.data().pokemonesIds).toJSON()
    } catch (error) {
      this.logger.error(`Error al obtener equipo: ${error.message}`)
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(`Error al obtener equipo: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async actualizarEquipo(equipoId: string, nombre: string, pokemonIds: number[]): Promise<any> {
    try {
      // Verificar cantidad de pokémon
      if (pokemonIds.length > 6) {
        throw new HttpException("Un equipo no puede tener más de 6 Pokémon", HttpStatus.BAD_REQUEST)
      }


      // Verificar que los Pokémon existan
      await Promise.all(pokemonIds.map((id) => this.getPokemon(id)))

      // Verificar que el equipo existe
      const equipoRef = doc(this.db, this.equiposCollection, equipoId)
      const equipoDoc = await getDoc(equipoRef)

      if (!equipoDoc.exists()) {
        throw new HttpException("Equipo no encontrado", HttpStatus.NOT_FOUND)
      }

      // Actualizar el equipo
      const equipoActualizado = new EquipoPokemon(equipoId, nombre, pokemonIds)
      await updateDoc(equipoRef, equipoActualizado.getUpdateJson())

      this.logger.log(`Equipo actualizado con ID: ${equipoId}`)

      return equipoActualizado.toJSON()
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
      const equipoRef = doc(this.db, this.equiposCollection, equipoId)
      const equipoDoc = await getDoc(equipoRef)

      if (!equipoDoc.exists()) {
        throw new HttpException("Equipo no encontrado", HttpStatus.NOT_FOUND)
      }

      // Buscar el entrenador que tiene este equipo
      const q = query(collection(this.db, this.equiposEntrenadorCollection), where("equiposIds", "array-contains", equipoId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const entrenadorDoc = querySnapshot.docs[0]; // solo hay un entrenador dueño del equipo
        const entrenadorData = entrenadorDoc.data();

        // Filtrar el equipo a eliminar de la lista de equiposIds
        const equiposActualizados = entrenadorData.equiposIds.filter((id: string) => id !== equipoId);

        // Actualizar la lista de equiposIds en Firestore
        await updateDoc(doc(this.db, this.equiposEntrenadorCollection, entrenadorDoc.id), {
          equiposIds: equiposActualizados
        });

        this.logger.log(`Equipo eliminado de la lista del entrenador con ID: ${entrenadorDoc.id}`);
      }

      // Eliminar el equipo de Firestore
      await deleteDoc(equipoRef);
      this.logger.log(`Equipo eliminado con ID: ${equipoId}`);
    } catch (error) {
      this.logger.error(`Error al eliminar equipo: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(`Error al eliminar equipo: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}

