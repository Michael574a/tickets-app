const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 5000;

// Configuración de CORS para permitir solicitudes desde la IP del frontend
app.use(cors({
  origin: '*', // Cambia esto por la IP de tu dispositivo si es necesario (e.g., 'http://192.168.1.107')
}));
app.use(express.json());

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'tickets_app', // Ajusta según el nombre de tu base de datos
  password: '2004Jd20', // Cambia por tu contraseña
  port: 5432,
});

// Ruta GET /maquinas - Obtener todas las máquinas
app.get('/maquinas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM maquinas');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener máquinas:', error.stack);
    res.status(500).json({ error: 'Error interno al obtener máquinas', details: error.message });
  }
});

// Ruta POST /maquinas - Crear una nueva máquina
app.post('/maquinas', async (req, res) => {
  console.log('Datos recibidos en POST /maquinas:', req.body);
  const { impresora, no_serie, edificio, oficina, estado, is_active } = req.body;
  if (!impresora || !no_serie || !edificio || !oficina || !estado || is_active === undefined) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO maquinas (impresora, no_serie, edificio, oficina, estado, is_active, created_at, modified_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *',
      [impresora, no_serie, edificio, oficina, estado, is_active]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear máquina:', error.stack);
    res.status(500).json({ error: 'Error interno al crear máquina', details: error.message });
  }
});

// Ruta PUT /maquinas/:id - Actualizar una máquina existente
app.put('/maquinas/:id', async (req, res) => {
  console.log('Datos recibidos en PUT /maquinas/:id:', req.body);
  const id = parseInt(req.params.id);
  const { impresora, no_serie, edificio, oficina, estado, is_active } = req.body;

  try {
    const currentMachine = await pool.query('SELECT * FROM maquinas WHERE id = $1', [id]);
    if (currentMachine.rowCount === 0) {
      return res.status(404).json({ error: 'Máquina no encontrada' });
    }

    const updatedImpresora = impresora !== undefined ? impresora : currentMachine.rows[0].impresora;
    const updatedNoSerie = no_serie !== undefined ? no_serie : currentMachine.rows[0].no_serie;
    const updatedEdificio = edificio !== undefined ? edificio : currentMachine.rows[0].edificio;
    const updatedOficina = oficina !== undefined ? oficina : currentMachine.rows[0].oficina;
    const updatedEstado = estado !== undefined ? estado : currentMachine.rows[0].estado;
    const updatedIsActive = is_active !== undefined ? is_active : currentMachine.rows[0].is_active;

    console.log('Valores para la actualización (maquinas):', {
      impresora: updatedImpresora,
      no_serie: updatedNoSerie,
      edificio: updatedEdificio,
      oficina: updatedOficina,
      estado: updatedEstado,
      is_active: updatedIsActive,
      id,
    });

    const result = await pool.query(
      'UPDATE maquinas SET impresora = $1, no_serie = $2, edificio = $3, oficina = $4, estado = $5, is_active = $6, modified_at = NOW() WHERE id = $7 RETURNING *',
      [updatedImpresora, updatedNoSerie, updatedEdificio, updatedOficina, updatedEstado, updatedIsActive, id]
    );

    if (result.rowCount === 0) {
      console.log('No se actualizó ningún registro, ID no encontrado:', id);
      return res.status(404).json({ error: 'Máquina no encontrada después de la actualización' });
    }

    console.log('Resultado de la actualización (maquinas):', result.rows[0]);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar máquina:', error.stack);
    res.status(500).json({ error: 'Error interno al actualizar máquina', details: error.message });
  }
});

// Ruta DELETE /maquinas/:id - Eliminar una máquina
app.delete('/maquinas/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query('DELETE FROM maquinas WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Máquina no encontrada' });
    }
    res.status(200).json({ message: 'Máquina eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar máquina:', error.stack);
    res.status(500).json({ error: 'Error interno al eliminar máquina', details: error.message });
  }
});

// Ruta GET /tickets - Obtener todos los tickets
app.get('/tickets', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tickets');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener tickets:', error.stack);
    res.status(500).json({ error: 'Error interno al obtener tickets', details: error.message });
  }
});

// Ruta POST /tickets - Crear un nuevo ticket
app.post('/tickets', async (req, res) => {
  console.log('Datos recibidos en POST /tickets:', req.body);
  const { id_impresora, tipo_danio, reporte, estado, is_active } = req.body; // Cambiado a tipo_danio para consistencia
  if (!id_impresora || !tipo_danio || !reporte || !estado || is_active === undefined) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO tickets (id_impresora, tipo_danio, reporte, estado, is_active, created_at, modified_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
      [id_impresora, tipo_danio, reporte, estado, is_active]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear ticket:', error.stack);
    res.status(500).json({ error: 'Error interno al crear ticket', details: error.message });
  }
});

// Ruta PUT /tickets/:id - Actualizar un ticket existente
app.put('/tickets/:id', async (req, res) => {
  console.log('Datos recibidos en PUT /tickets/:id:', req.body);
  const id = parseInt(req.params.id);
  const { id_impresora, tipo_danio, reporte, estado, is_active } = req.body; // Cambiado a tipo_danio para consistencia

  try {
    const currentTicket = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (currentTicket.rowCount === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // Depuración explícita para tipo_danio
    console.log('Valor de tipo_danio recibido:', tipo_danio);
    console.log('Valor actual de tipo_danio en la DB:', currentTicket.rows[0].tipo_danio);

    const updatedIdImpresora = id_impresora !== undefined ? id_impresora : currentTicket.rows[0].id_impresora;
    const updatedTipoDanio = tipo_danio !== undefined ? tipo_danio : currentTicket.rows[0].tipo_danio; // Corregido para usar tipo_danio
    const updatedReporte = reporte !== undefined ? reporte : currentTicket.rows[0].reporte;
    const updatedEstado = estado !== undefined ? estado : currentTicket.rows[0].estado;
    const updatedIsActive = is_active !== undefined ? is_active : currentTicket.rows[0].is_active;

    console.log('Valores para la actualización (tickets):', {
      id_impresora: updatedIdImpresora,
      tipo_danio: updatedTipoDanio,
      reporte: updatedReporte,
      estado: updatedEstado,
      is_active: updatedIsActive,
      id,
    });

    const result = await pool.query(
      'UPDATE tickets SET id_impresora = $1, tipo_danio = $2, reporte = $3, estado = $4, is_active = $5, modified_at = NOW() WHERE id = $6 RETURNING *',
      [updatedIdImpresora, updatedTipoDanio, updatedReporte, updatedEstado, updatedIsActive, id]
    );

    if (result.rowCount === 0) {
      console.log('No se actualizó ningún registro, ID no encontrado:', id);
      return res.status(404).json({ error: 'Ticket no encontrado después de la actualización' });
    }

    console.log('Resultado de la actualización (tickets):', result.rows[0]);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar ticket:', error.stack);
    res.status(500).json({ error: 'Error interno al actualizar ticket', details: error.message });
  }
});

// Ruta DELETE /tickets/:id - Eliminar un ticket
app.delete('/tickets/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query('DELETE FROM tickets WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    res.status(200).json({ message: 'Ticket eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar ticket:', error.stack);
    res.status(500).json({ error: 'Error interno al eliminar ticket', details: error.message });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});