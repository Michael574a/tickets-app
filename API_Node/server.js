require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const XLSX = require("xlsx"); // Para exportar a Excel
const PDFDocument = require("pdfkit"); // Para exportar a PDF
const app = express();
const port = 5000;

console.log("DB_PASSWORD:", process.env.DB_PASSWORD, typeof process.env.DB_PASSWORD); // Justo antes de crear el pool

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD) : "",
  port: Number(process.env.DB_PORT),
});
const SECRET_KEY = process.env.SECRET_KEY;

app.use(cors());
app.use(bodyParser.json());

// Middleware de depuración global
app.use((req, res, next) => {
  console.log(`Ruta recibida: ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware de autenticación
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("No se proporcionó token de autenticación");
    return res.status(401).json({ error: "No se proporcionó token de autenticación" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.log("Error al verificar el token:", err.message);
      return res.status(403).json({ error: "Token inválido" });
    }
    req.user = user;
    console.log("Usuario autenticado:", req.user);
    next();
  });
}

// Middleware de auditoría para "update" y "delete"
const auditMiddleware = async (req, res, next) => {
  const { method, path, baseUrl } = req;
  const user = req.user;
  let resource = "";

  // Combine baseUrl and path to get the full route, then extract the resource
  const fullPath = (baseUrl + path).split("/").filter(segment => segment);
  if (fullPath.length > 0 && ["maquinas", "tickets", "usuarios"].includes(fullPath[0])) {
    resource = fullPath[0];
  }
  console.log(`Extraído resource: ${resource}, user: ${JSON.stringify(user)}`);

  const actionMap = {
    put: "update",
    delete: "delete",
  };

  const auditAction = actionMap[method.toLowerCase()];

  if (auditAction && user && resource && req.params.id) {
    console.log(`Registrando auditoría: ${auditAction} en ${resource} por usuario ${user.id}`);
    const resourceId = parseInt(req.params.id);

    let details = {};
    if (auditAction === "update") {
      try {
        // Obtener los datos antiguos
        const oldDataResult = await pool.query(`SELECT * FROM ${resource} WHERE id = $1`, [resourceId]);
        const oldData = oldDataResult.rows[0] || {};

        // Obtener los datos nuevos después de la actualización (ejecutar después de la operación principal)
        // Guardamos los datos del cuerpo de la solicitud por ahora
        const newDataBody = req.body || {};

        // Para obtener los datos nuevos reales, necesitamos esperar a que la actualización ocurra
        // Por lo tanto, primero permitimos que el controlador realice la actualización
        // Guardamos los datos antiguos y el cuerpo para usarlos después
        res.locals.oldData = oldData;
        res.locals.newDataBody = newDataBody;

        // Continuamos con la solicitud y registraremos la auditoría después
        next();
        return;
      } catch (error) {
        console.error("Error al obtener datos antiguos:", error.message, error.stack);
        details = { error: "No se pudieron obtener datos antiguos" };
      }
    } else if (auditAction === "delete") {
      try {
        const deletedDataResult = await pool.query(`SELECT * FROM ${resource} WHERE id = $1`, [resourceId]);
        const deletedData = deletedDataResult.rows[0] || {};
        details = {
          old_data: deletedData,
        };
      } catch (error) {
        console.error("Error al obtener datos eliminados:", error.message, error.stack);
        details = { error: "No se pudieron obtener datos eliminados" };
      }
    }

    try {
      const result = await pool.query(
        "INSERT INTO audit_logs (action, resource, resource_id, user_id, user_name, rol, details, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *",
        [auditAction, resource, resourceId, user.id, user.usuario, user.rol, JSON.stringify(details)]
      );
      console.log("Registro de auditoría creado:", result.rows[0]);
    } catch (error) {
      console.error("Error al registrar auditoría:", error.message, error.stack);
    }
  } else {
    console.log(
      `No se registra auditoría para: ${method} ${baseUrl}${path}. Razón: auditAction=${auditAction}, user=${JSON.stringify(
        user
      )}, resource=${resource}, id=${req.params.id}`
    );
  }

  next();
};

// Middleware para registrar auditoría después de la actualización
const auditUpdatePostMiddleware = async (req, res, next) => {
  const { method, path, baseUrl } = req;
  const user = req.user;
  let resource = "";

  const fullPath = (baseUrl + path).split("/").filter(segment => segment);
  if (fullPath.length > 0 && ["maquinas", "tickets", "usuarios"].includes(fullPath[0])) {
    resource = fullPath[0];
  }

  const auditAction = method.toLowerCase() === "put" ? "update" : null;
  const resourceId = req.params.id ? parseInt(req.params.id) : null;

  if (auditAction && user && resource && resourceId && res.locals.oldData) {
    try {
      // Obtener los datos nuevos después de la actualización
      const newDataResult = await pool.query(`SELECT * FROM ${resource} WHERE id = $1`, [resourceId]);
      const newData = newDataResult.rows[0] || {};

      // Asegurarnos de que el id esté en ambos
      const oldData = res.locals.oldData;
      oldData.id = resourceId;
      newData.id = resourceId;

      // Filtrar created_at solo en old_data y modified_at solo en new_data
      const oldDataFiltered = { ...oldData };
      delete oldDataFiltered.modified_at;
      const newDataFiltered = { ...newData };
      delete newDataFiltered.created_at;

      const details = {
        old_data: oldDataFiltered,
        new_data: newDataFiltered,
      };

      const result = await pool.query(
        "INSERT INTO audit_logs (action, resource, resource_id, user_id, user_name, rol, details, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *",
        [auditAction, resource, resourceId, user.id, user.usuario, user.rol, JSON.stringify(details)]
      );
      console.log("Registro de auditoría creado (post-update):", result.rows[0]);
    } catch (error) {
      console.error("Error al registrar auditoría (post-update):", error.message, error.stack);
    }
  }

  next();
};


const auditCreateMiddleware = async (req, res, next) => {
  const { method, path, baseUrl } = req;
  const user = req.user;
  let resource = "";

 
  const fullPath = (baseUrl + path).split("/").filter(segment => segment);
  if (fullPath.length > 0 && ["maquinas", "tickets", "usuarios"].includes(fullPath[0])) {
    resource = fullPath[0];
  }

  const auditAction = method.toLowerCase() === "post" ? "create" : null;

  if (auditAction && user && resource && res.locals.createdId) {
    const resourceId = res.locals.createdId;
    let details = {};
    try {
      const newDataResult = await pool.query(`SELECT * FROM ${resource} WHERE id = $1`, [resourceId]);
      const newData = newDataResult.rows[0] || {};
      details = {
        new_data: newData,
      };
    } catch (error) {
      console.error("Error al obtener datos creados:", error.message, error.stack);
      details = { error: "No se pudieron obtener datos creados" };
    }

    try {
      const result = await pool.query(
        "INSERT INTO audit_logs (action, resource, resource_id, user_id, user_name, rol, details, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *",
        [auditAction, resource, resourceId, user.id, user.usuario, user.rol, JSON.stringify(details)]
      );
      console.log("Registro de auditoría creado (post-handler):", result.rows[0]);
    } catch (error) {
      console.error("Error al registrar auditoría (post-handler):", error.message, error.stack);
    }
  }

  next();
};




app.post("/login", async (req, res) => {
  //console.log("Cuerpo recibido:", req.body);
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Cuerpo de solicitud inválido" });
  }
  const { usuario, contraseña } = req.body;
  //console.log("Datos recibidos:", { usuario, contraseña });
  try {
    const result = await pool.query("SELECT * FROM usuarios WHERE usuario = $1", [usuario]);
    
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });
    const validPassword = await bcrypt.compare(contraseña, user.contraseña);
    if (!validPassword) return res.status(401).json({ error: "Contraseña incorrecta" });
    const token = jwt.sign({ id: user.id, usuario: user.usuario, rol: user.rol }, SECRET_KEY, { expiresIn: "8h" });
    res.json({ token, usuario: { id: user.id, nombre: user.usuario, rol: user.rol } });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});


app.get("/audit-logs", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT al.*
      FROM audit_logs al
      ORDER BY timestamp DESC
    `);
    console.log("Logs de auditoría enviados:", result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener logs de auditoría:", error);
    res.status(500).json({ error: "Error al obtener logs de auditoría" });
  }
});


app.get("/audit-logs/export/pdf", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT al.*
      FROM audit_logs al
      ORDER BY timestamp DESC
    `);
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    res.setHeader("Content-Disposition", `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    
    doc.fontSize(18).text("Reporte de Auditorías", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Fecha de generación: ${new Date().toLocaleString('es-ES')}`, { align: "center" });
    doc.moveDown(1.5);

  
    const tableHeaders = [
      "ID", "Usuario", "Rol", "Acción", "Recurso", "ID Recurso", "Fecha y Hora"
    ];
    const startX = doc.x;
    let y = doc.y;

    
    tableHeaders.forEach((header, i) => {
      doc.font('Helvetica-Bold').fontSize(10).text(header, startX + i * 100, y, { width: 100, align: 'center' });
    });
    y += 20;
    doc.moveTo(startX, y - 5).lineTo(startX + tableHeaders.length * 100, y - 5).stroke();

    
    result.rows.forEach((log) => {
      const actionText = log.action === "create" ? "Creó" : log.action === "update" ? "Actualizó" : "Eliminó";
      doc.font('Helvetica').fontSize(9)
        .text(log.id, startX + 0, y, { width: 100, align: 'center' })
        .text(log.user_name, startX + 100, y, { width: 100, align: 'center' })
        .text(log.rol, startX + 200, y, { width: 100, align: 'center' })
        .text(actionText, startX + 300, y, { width: 100, align: 'center' })
        .text(log.resource, startX + 400, y, { width: 100, align: 'center' })
        .text(log.resource_id, startX + 500, y, { width: 100, align: 'center' })
        .text(new Date(log.timestamp).toLocaleString('es-ES'), startX + 600, y, { width: 120, align: 'center' });
      y += 18;

      // Si quieres agregar detalles como subtabla, puedes hacerlo aquí (opcional)
    });

    doc.end();
  } catch (error) {
    console.error("Error al generar PDF:", error);
    res.status(500).send("Error al generar el PDF");
  }
});

// Endpoint para exportar a Excel
app.get("/audit-logs/export/excel", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT al.*
      FROM audit_logs al
      ORDER BY timestamp DESC
    `);
    const wb = XLSX.utils.book_new();
    const wsData = result.rows.map(log => {
      const actionText = log.action === "create" ? "Creó" : log.action === "update" ? "Actualizó" : "Eliminó";
      const resourceArticle = log.resource === "maquinas" ? "una" : log.resource === "tickets" ? "un" : "un";
      const details = log.details
        ? typeof log.details === "string"
          ? JSON.parse(log.details)
          : log.details
        : {};
      const detailsText =
        log.action === "create"
          ? `Creó ${resourceArticle} ${log.resource} con el ID: ${log.resource_id || "Desconocido"}. Datos nuevos: ${JSON.stringify(details.new_data || {})}`
          : log.action === "update"
          ? `Actualizó ${resourceArticle} ${log.resource} con el ID: ${log.resource_id || "Desconocido"}. Datos antiguos: ${JSON.stringify(details.old_data || {})}, Datos nuevos: ${JSON.stringify(details.new_data || {})}`
          : `Eliminó ${resourceArticle} ${log.resource} con el ID: ${log.resource_id || "Desconocido"}. Datos eliminados: ${JSON.stringify(details.old_data || {})}`;
      return {
        ID: log.id,
        Nombre: log.user_name,
        Rol: log.rol,
        Acción: actionText,
        Detalles: detailsText,
        "Fecha y Hora": new Date(log.timestamp).toLocaleString('es-ES'),
      };
    });
    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Auditorías");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
    res.setHeader("Content-Disposition", `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error al generar Excel:", error);
    res.status(500).send("Error al generar el Excel");
  }
});

// Router para máquinas
const maquinasRouter = express.Router();
maquinasRouter.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM maquinas WHERE is_active = true");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener máquinas:", error);
    res.status(500).send("Error al obtener máquinas");
  }
});
maquinasRouter.post("/", async (req, res, next) => {
  const { impresora, no_serie, edificio, oficina, estado, is_active } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO maquinas (impresora, no_serie, edificio, oficina, estado, is_active, created_at, modified_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *",
      [impresora, no_serie, edificio, oficina, estado, is_active !== undefined ? is_active : true]
    );
    res.locals.createdId = result.rows[0].id;
    res.json(result.rows[0]);
    next(); // Proceed to auditCreateMiddleware
  } catch (error) {
    console.error("Error al crear máquina:", error);
    res.status(500).send("Error al crear máquina");
  }
}, auditCreateMiddleware);
maquinasRouter.put("/:id", authenticateToken, auditMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const { impresora, no_serie, edificio, oficina, estado, is_active } = req.body;
  try {
    const result = await pool.query(
      "UPDATE maquinas SET impresora = $1, no_serie = $2, edificio = $3, oficina = $4, estado = $5, is_active = $6, modified_at = NOW() WHERE id = $7 RETURNING *",
      [impresora, no_serie, edificio, oficina, estado, is_active !== undefined ? is_active : true, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Máquina no encontrada" });
    }
    res.json(result.rows[0]);
    next(); // Proceed to auditUpdatePostMiddleware
  } catch (error) {
    console.error("Error al actualizar máquina:", error);
    res.status(500).send("Error al actualizar máquina");
  }
}, auditUpdatePostMiddleware);
maquinasRouter.delete("/:id", authenticateToken, auditMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("UPDATE maquinas SET is_active = false, modified_at = NOW() WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Máquina no encontrada" });
    }
    res.json({ message: "Máquina eliminada lógicamente" });
  } catch (error) {
    console.error("Error al eliminar máquina:", error);
    res.status(500).send("Error al eliminar máquina");
  }
});

// Router para tickets
const ticketsRouter = express.Router();
ticketsRouter.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, m.impresora as impresora_nombre 
      FROM tickets t
      LEFT JOIN maquinas m ON t.id_impresora = m.id
      WHERE t.is_active = true
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener tickets:", error);
    res.status(500).send("Error al obtener tickets");
  }
});
ticketsRouter.post("/", async (req, res, next) => {
  const { id_impresora, tipo_danio, reporte, estado, is_active } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO tickets (id_impresora, tipo_danio, reporte, estado, is_active, created_at, modified_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *",
      [id_impresora, tipo_danio, reporte, estado, is_active !== undefined ? is_active : true]
    );
    res.locals.createdId = result.rows[0].id;
    res.json(result.rows[0]);
    next(); // Proceed to auditCreateMiddleware
  } catch (error) {
    console.error("Error al crear ticket:", error);
    res.status(500).send("Error al crear ticket");
  }
}, auditCreateMiddleware);
ticketsRouter.put("/:id", authenticateToken, auditMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const { id_impresora, tipo_danio, reporte, estado, is_active } = req.body;
  try {
    const result = await pool.query(
      "UPDATE tickets SET id_impresora = $1, tipo_danio = $2, reporte = $3, estado = $4, is_active = $5, modified_at = NOW() WHERE id = $6 RETURNING *",
      [id_impresora, tipo_danio, reporte, estado, is_active !== undefined ? is_active : true, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }
    res.json(result.rows[0]);
    next(); // Proceed to auditUpdatePostMiddleware
  } catch (error) {
    console.error("Error al actualizar ticket:", error);
    res.status(500).send("Error al actualizar ticket");
  }
}, auditUpdatePostMiddleware);
ticketsRouter.delete("/:id", authenticateToken, auditMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("UPDATE tickets SET is_active = false, modified_at = NOW() WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }
    res.json({ message: "Ticket eliminado lógicamente" });
  } catch (error) {
    console.error("Error al eliminar ticket:", error);
    res.status(500).send("Error al eliminar ticket");
  }
});

// Router para usuarios
const usuariosRouter = express.Router();
usuariosRouter.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, usuario, rol, created_at, modified_at FROM usuarios");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).send("Error al obtener usuarios");
  }
});
usuariosRouter.post("/register", async (req, res, next) => {
  const { usuario, contraseña, rol } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    const result = await pool.query(
      "INSERT INTO usuarios (usuario, contraseña, rol, created_at, modified_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *",
      [usuario, hashedPassword, rol]
    );
    res.locals.createdId = result.rows[0].id;
    res.status(201).json(result.rows[0]);
    next(); 
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
}, auditCreateMiddleware);
usuariosRouter.post("/", async (req, res, next) => {
  const { usuario, contraseña, rol } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    const result = await pool.query(
      "INSERT INTO usuarios (usuario, contraseña, rol, created_at, modified_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, usuario, rol",
      [usuario, hashedPassword, rol]
    );
    res.locals.createdId = result.rows[0].id;
    res.status(201).json(result.rows[0]);
    next(); // Proceed to auditCreateMiddleware
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).send("Error al crear usuario");
  }
}, auditCreateMiddleware);
usuariosRouter.put("/:id", authenticateToken, auditMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const { usuario, contraseña, rol } = req.body;
  try {
    const hashedPassword = contraseña ? await bcrypt.hash(contraseña, 10) : undefined;
    const result = await pool.query(
      `UPDATE usuarios SET 
        usuario = $1, 
        ${contraseña ? "contraseña = $2," : ""} 
        rol = $3, 
        modified_at = NOW() 
      WHERE id = $4 RETURNING id, usuario, rol`,
      contraseña ? [usuario, hashedPassword, rol, id] : [usuario, rol, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(result.rows[0]);
    next(); 
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).send("Error al actualizar usuario");
  }
}, auditUpdatePostMiddleware);
usuariosRouter.delete("/:id", authenticateToken, auditMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM usuarios WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).send("Error al eliminar usuario");
  }
});


app.use("/maquinas", authenticateToken, maquinasRouter);
app.use("/tickets", authenticateToken, ticketsRouter);
app.use("/usuarios", authenticateToken, usuariosRouter);


app.get("/", (req, res) => {
  res.json({ message: "Bienvenido al servidor de Tickets App" });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});