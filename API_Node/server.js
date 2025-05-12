const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'KeyPrueba654321';
const app = express();
const port = 5000;


const pool = new Pool({
  user: "postgres", 
  host: "localhost",
  database: "db_tickets", 
  password: "1234",
  port: 5432,
});


app.use(cors());
app.use(bodyParser.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.post('/login', async (req, res) => {
  const { usuario, contraseña } = req.body;
  console.log('Datos recibidos:', req.body);
    
  
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE usuario = $1', [usuario]);
    console.log('Usuario encontrado:', result.rows[0]); 
    
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    
    // console.log('Comparando contraseña:', contraseña, 'con hash:', user.contraseña);
    // const validPassword = await bcrypt.compare(contraseña, user.contraseña);
    // console.log('Resultado comparación:', validPassword);
    
    // if (!validPassword) {
    //   return res.status(401).json({ error: 'Contraseña incorrecta' });
    // }
    if (contraseña === user.contraseña) {
  console.log("Contraseña correcta");
} else {
  return res.status(401).json({ error: "Contraseña incorrecta" });
}
    
    // if (!user.is_active) {
    //   return res.status(403).json({ error: 'Cuenta desactivada' });
    // }
    
    const token = jwt.sign(
      { id: user.id, usuario: user.usuario, rol: user.rol },
      SECRET_KEY,
      { expiresIn: '8h' }
    );
    
    res.json({ token, rol: user.rol });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});




app.get("/maquinas", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM maquinas");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener máquinas:", error);
    res.status(500).send("Error al obtener máquinas");
  }
});

app.post("/maquinas", async (req, res) => {
  const { edificio, oficina, impresora, no_serie, estado, is_active } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO maquinas (edificio, oficina, impresora, no_serie, estado, is_active, created_at, modified_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *",
      [edificio, oficina, impresora, no_serie, estado, is_active || true] 
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear máquina:", error);
    res.status(500).send("Error al crear máquina");
  }
}); 

app.put("/maquinas/:id", async (req, res) => {
  const { id } = req.params;
  const { edificio, oficina, impresora, no_serie, estado } = req.body; // Elimina is_active
  try {
    const result = await pool.query(
      "UPDATE maquinas SET edificio = $1, oficina = $2, impresora = $3, no_serie = $4, estado = $5, is_active = True, modified_at = NOW() WHERE id = $6 RETURNING *",
      [edificio, oficina, impresora, no_serie, estado, id] // Ajusta la lista de valores
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
    res.json({ message: "Máquina eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar máquina:", error);
    res.status(500).send("Error al eliminar máquina");
  }
});

app.delete("/tickets/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM tickets WHERE id = $1", [id]);
    res.json({ message: "Ticket eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar ticket:", error);
    res.status(500).send("Error al eliminar ticket");
  }
});

app.get("/tickets", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, m.impresora as impresora_nombre 
      FROM tickets t
      LEFT JOIN maquinas m ON t.id_impresora = m.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener tickets:", error);
    res.status(500).send("Error al obtener tickets");
  }
});
app.post("/tickets", async (req, res) => {
  const { id_impresora, tipo_danio, reporte, estado, is_active } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO tickets (id_impresora, tipo_danio, reporte, estado, is_active, created_at, modified_at) VALUES ($1, $2, $3, $4, True, NOW(), NOW()) RETURNING *",
      [id_impresora, tipo_danio, reporte, estado]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear ticket:", error);
    res.status(500).send("Error al crear ticket");
  }
});
app.post('/register', async (req, res) => {
  const { usuario, contraseña, rol } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (usuario, contraseña, rol) VALUES ($1, $2, $3) RETURNING *',
      [usuario, hashedPassword, rol]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

app.put("/tickets/:id", async (req, res) => {
  const { id } = req.params;
  const { id_impresora, tipo_danio, reporte, estado } = req.body; // Elimina is_active
  try {
    const result = await pool.query(
      "UPDATE tickets SET id_impresora = $1, tipo_danio = $2, reporte = $3, estado = $4, modified_at = NOW() WHERE id = $5 RETURNING *",
      [id_impresora, tipo_danio, reporte, estado, id] // Ajusta la lista de valores
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar ticket:", error);
    res.status(500).send("Error al actualizar ticket");
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});