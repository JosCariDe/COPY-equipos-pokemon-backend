# API de Entrenadores, Equipos y Pokémon

Este documento describe los endpoints disponibles en la API de entrenadores, equipos y Pokémon.

## **Entrenadores**

### Obtener todos los entrenadores
- **Endpoint:** `GET /api/entrenadores`
- **Descripción:** Obtiene la lista de todos los entrenadores.
- **Código de respuesta:** `200 OK`
- **Respuesta:**
  ```json
  [
    {
      "id": "1",
      "birth_date": "1990-01-01",
      "email": "ash.ketchum@example.com",
      "first_name": "Ash",
      "last_name": "Ketchum"
    }
  ]
  ```

### Obtener un entrenador por ID
- **Endpoint:** `GET /api/entrenadores/:id`
- **Descripción:** Obtiene la información de un entrenador por su ID.
- **Parámetros:**
  - `id` (path): ID del entrenador (cadena de texto)
- **Código de respuesta:** `200 OK`, `404 Not Found`
- **Respuesta:**
  ```json
  {
      "id": "1",
      "birth_date": "1990-01-01",
      "email": "ash.ketchum@example.com",
      "first_name": "Ash",
      "last_name": "Ketchum"
    }
  ```

---

## **Equipos de Entrenador**

### Crear un equipo de entrenador
- **Endpoint:** `POST /api/equipos-entrenador`
- **Descripción:** Crea un nuevo equipo para un entrenador.
- **Código de respuesta:** `201 Created`, `400 Bad Request`
- **Body:**
  ```json
  {
    "entrenadorId": "1",
    "equiposIds": ["eq123", "eq456"],
    "equipoSeleccionado": "eq123"
  }
  ```
- **Respuesta:**
  ```json
  {
    "id": "eq789",
    "entrenadorId": "1",
    "equiposIds": ["eq123", "eq456"],
    "equipoSeleccionado": "eq123"
  }
  ```

### Obtener un equipo de entrenador por ID
- **Endpoint:** `GET /api/equipos-entrenador/:id`
- **Código de respuesta:** `200 OK`, `404 Not Found`
- **Respuesta:**
  ```json
  {
    "id": "eq789",
    "entrenadorId": "1",
    "equiposIds": ["eq123", "eq456"],
    "equipoSeleccionado": "eq123"
  }
  ```

### Obtener equipos de un entrenador
- **Endpoint:** `GET /api/equipos-entrenador/entrenador/:entrenadorId`
- **Código de respuesta:** `200 OK`, `404 Not Found`
- **Respuesta:**
  ```json
  [
    {
      "id": "eq789",
      "entrenadorId": "1",
      "equiposIds": ["eq123", "eq456"],
      "equipoSeleccionado": "eq123"
    }
  ]

### Actualizar un equipo de entrenador
- **Endpoint:** `PUT /api/equipos-entrenador/:id`
- **Código de respuesta:** `200 OK`, `400 Bad Request`, `404 Not Found`
- **Body:**
  ```json
  {
    "entrenadorId": "1",
    "equiposIds": ["eq111", "eq222"],
    "equipoSeleccionado": "eq222"
  }
  ```

### Eliminar un equipo de entrenador
- **Endpoint:** `DELETE /api/equipos-entrenador/:id`
- **Código de respuesta:** `204 No Content`, `404 Not Found`

---

## **Equipos Pokémon**

### Crear un equipo Pokémon
- **Endpoint:** `POST /api/equipos`
- **Código de respuesta:** `201 Created`, `400 Bad Request`
- **Body:**
  ```json
  {
    "nombre": "Equipo Pikachu",
    "pokemonIds": [25, 4, 7]
  }
  ```
- **Respuesta:**
  ```json
  {
    "id": "eq001",
    "nombre": "Equipo Pikachu",
    "pokemonIds": [25, 4, 7]
  }
  ```

### Obtener un equipo por ID
- **Endpoint:** `GET /api/equipos/:id`
- **Código de respuesta:** `200 OK`, `404 Not Found`
- **Respuesta:** 
  ```json
  {
    "id": "eq001",
    "nombre": "Equipo Pikachu",
    "pokemonIds": [25, 4, 7]
  }

### Actualizar un equipo
- **Endpoint:** `PUT /api/equipos/:id`
- **Código de respuesta:** `200 OK`, `400 Bad Request`, `404 Not Found`
- **Body:**
  ```json
  {
    "nombre": "Equipo Evoluciones",
    "pokemonIds": [133, 134, 135, 136]
  }
  ```

### Eliminar un equipo
- **Endpoint:** `DELETE /api/equipos/:id`
- **Código de respuesta:** `204 No Content`, `404 Not Found`

---

## **Pokémon**

### Obtener todos los Pokémon
- **Endpoint:** `GET /api/pokemon`
- **Código de respuesta:** `200 OK`

### Obtener un Pokémon por ID
- **Endpoint:** `GET /api/pokemon/:id`
- **Código de respuesta:** `200 OK`, `404 Not Found`

