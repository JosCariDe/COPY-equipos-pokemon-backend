-- Crear tabla de Equipos
CREATE TABLE Equipos (
    id NVARCHAR(36) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    pokemonesIds NVARCHAR(MAX) NOT NULL, -- JSON array de IDs de Pokémon
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
);

-- Crear tabla de EquiposEntrenador
CREATE TABLE EquiposEntrenador (
    id NVARCHAR(36) PRIMARY KEY,
    entrenadorId INT NOT NULL,
    equiposIds NVARCHAR(MAX) NOT NULL, -- JSON array de IDs de equipos
    equipoSeleccionado NVARCHAR(36) NOT NULL,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
);

-- Stored Procedure para crear un equipo
CREATE PROCEDURE sp_CrearEquipo
    @entrenadorId INT,
    @nombre NVARCHAR(100),
    @pokemonIds NVARCHAR(MAX)
AS
BEGIN
    DECLARE @equipoId NVARCHAR(36) = NEWID();
    
    INSERT INTO Equipos (id, nombre, pokemonesIds)
    VALUES (@equipoId, @nombre, @pokemonIds);
    
    SELECT @equipoId AS id;
END;

-- Stored Procedure para actualizar un equipo
CREATE PROCEDURE sp_ActualizarEquipo
    @equipoId NVARCHAR(36),
    @nombre NVARCHAR(100),
    @pokemonIds NVARCHAR(MAX)
AS
BEGIN
    UPDATE Equipos
    SET nombre = @nombre,
        pokemonesIds = @pokemonIds,
        updatedAt = GETDATE()
    WHERE id = @equipoId;
END;

-- Stored Procedure para eliminar un equipo
CREATE PROCEDURE sp_EliminarEquipo
    @equipoId NVARCHAR(36)
AS
BEGIN
    DELETE FROM Equipos
    WHERE id = @equipoId;
END;

-- Stored Procedure para crear un equipo de entrenador
CREATE PROCEDURE sp_CrearEquipoEntrenador
    @entrenadorId INT,
    @equiposIds NVARCHAR(MAX),
    @equipoSeleccionado NVARCHAR(36)
AS
BEGIN
    DECLARE @equipoEntrenadorId NVARCHAR(36) = NEWID();
    
    INSERT INTO EquiposEntrenador (id, entrenadorId, equiposIds, equipoSeleccionado)
    VALUES (@equipoEntrenadorId, @entrenadorId, @equiposIds, @equipoSeleccionado);
    
    SELECT @equipoEntrenadorId AS id;
END;

-- Stored Procedure para actualizar un equipo de entrenador
CREATE PROCEDURE sp_ActualizarEquipoEntrenador
    @equipoEntrenadorId NVARCHAR(36),
    @entrenadorId INT,
    @equiposIds NVARCHAR(MAX),
    @equipoSeleccionado NVARCHAR(36)
AS
BEGIN
    UPDATE EquiposEntrenador
    SET entrenadorId = @entrenadorId,
        equiposIds = @equiposIds,
        equipoSeleccionado = @equipoSeleccionado,
        updatedAt = GETDATE()
    WHERE id = @equipoEntrenadorId;
END;

-- Stored Procedure para eliminar un equipo de entrenador
CREATE PROCEDURE sp_EliminarEquipoEntrenador
    @equipoEntrenadorId NVARCHAR(36)
AS
BEGIN
    DELETE FROM EquiposEntrenador
    WHERE id = @equipoEntrenadorId;
END;

