const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = 5000;

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: "postgres", // Cambia esto por tu usuario de PostgreSQL
  host: "localhost",
  database: "db_tickets", // Cambia esto por el nombre de tu base de datos
  password: "1234", // Cambia esto por tu contraseña de PostgreSQL
  port: 5432,
});

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Rutas para la tabla "maquinas"
app.get("/maquinas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id AS _id, 
        edificio, 
        oficina, 
        impresora, 
        no_serie AS "noSerie", 
        estado, 
        is_active AS "isActive", 
        created_at AS "createdAt", 
        modified_at AS "modifiedAt" 
      FROM maquinas
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener máquinas:", error);
    res.status(500).send("Error al obtener máquinas");
  }
});

app.post("/maquinas", async (req, res) => {
  const { edificio, oficina, impresora, noSerie, estado, isActive } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO maquinas (edificio, oficina, impresora, no_serie, estado, is_active, created_at, modified_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *",
      [edificio, oficina, impresora, noSerie, estado, isActive]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear máquina:", error);
    res.status(500).send("Error al crear máquina");
  }
});

app.put("/maquinas/:id", async (req, res) => {
  const { id } = req.params;
  const { edificio, oficina, impresora, noSerie, estado, isActive } = req.body;
  try {
    const result = await pool.query(
      "UPDATE maquinas SET edificio = $1, oficina = $2, impresora = $3, no_serie = $4, estado = $5, is_active = $6, modified_at = NOW() WHERE id = $7 RETURNING *",
      [edificio, oficina, impresora, noSerie, estado, isActive, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar máquina:", error);
    res.status(500).send("Error al actualizar máquina");
  }
});

app.delete("/maquinas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM maquinas WHERE id = $1", [id]);
    res.sendStatus(204); // No Content
  } catch (error) {
    console.error("Error al eliminar máquina:", error);
    res.status(500).send("Error al eliminar máquina");
  }
});

// Rutas para la tabla "tickets"
app.get("/tickets", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id AS _id, 
        id_impresora AS "idImpresora", 
        tipo_danio AS "tipoDanio", 
        reporte, 
        estado, 
        is_active AS "isActive", 
        created_at AS "createdAt", 
        modified_at AS "modifiedAt" 
      FROM tickets
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener tickets:", error);
    res.status(500).send("Error al obtener tickets");
  }
});

app.post("/tickets", async (req, res) => {
  const { idImpresora, tipoDanio, reporte, estado, isActive } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO tickets (id_impresora, tipo_danio, reporte, estado, is_active, created_at, modified_at) 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
       RETURNING id AS _id, id_impresora AS "idImpresora", tipo_danio AS "tipoDanio", reporte, estado, is_active AS "isActive", created_at AS "createdAt", modified_at AS "modifiedAt"`,
      [idImpresora, tipoDanio, reporte, estado, isActive]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear ticket:", error);
    res.status(500).send("Error al crear ticket");
  }
});

app.put("/tickets/:id", async (req, res) => {
  const { id } = req.params;
  const { idImpresora, tipoDanio, reporte, estado, isActive } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tickets 
       SET id_impresora = $1, tipo_danio = $2, reporte = $3, estado = $4, is_active = $5, modified_at = NOW() 
       WHERE id = $6 
       RETURNING id AS _id, id_impresora AS "idImpresora", tipo_danio AS "tipoDanio", reporte, estado, is_active AS "isActive", created_at AS "createdAt", modified_at AS "modifiedAt"`,
      [idImpresora, tipoDanio, reporte, estado, isActive, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar ticket:", error);
    res.status(500).send("Error al actualizar ticket");
  }
});

app.delete("/tickets/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM tickets WHERE id = $1", [id]);
    res.sendStatus(204); // No Content
  } catch (error) {
    console.error("Error al eliminar ticket:", error);
    res.status(500).send("Error al eliminar ticket");
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});