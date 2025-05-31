import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useEffect, useState } from "react";
import { Alert, Dimensions, FlatList, Platform, ScrollView, StyleSheet, View } from "react-native";
import {
  Appbar,
  Button,
  Chip,
  Modal,
  Portal,
  Provider,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { Row, Rows, Table } from "react-native-table-component";
import { API_URL } from "../config/config"; // Ajusta la ruta según la ubicación del archivo

const AdministradorScreen = () => {
  const theme = useTheme();
  const [tab, setTab] = useState("tickets");

  // State for data fetched from the backend
  const [tickets, setTickets] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState(null);

  // State for ticket modal
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    id_impresora: "",
    tipo_danio: "",
    reporte: "",
    estado: "Pendiente",
    is_active: true,
  });

  // State for machine modal
  const [visibleMaquina, setVisibleMaquina] = useState(false);
  const [editingMaquina, setEditingMaquina] = useState(null);
  const [formMaquina, setFormMaquina] = useState({
    impresora: "",
    no_serie: "",
    edificio: "",
    oficina: "",
    estado: "Operativa",
    is_active: true,
  });

  // State for user modal
  const [visibleUsuario, setVisibleUsuario] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [formUsuario, setFormUsuario] = useState({
    usuario: "",
    contraseña: "",
    rol: "tecnico",
  });

  // Fetch all data on component mount
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        setError("Debes iniciar sesión para acceder a los datos.");
        Alert.alert("Error", "Debes iniciar sesión para acceder a los datos.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [tRes, mRes, uRes, aRes] = await Promise.all([
        axios.get(`${API_URL}/tickets`, { headers }).catch((err) => {
          console.error("Error fetching tickets:", err.message);
          return { data: [] };
        }),
        axios.get(`${API_URL}/maquinas`, { headers }).catch((err) => {
          console.error("Error fetching maquinas:", err.message);
          return { data: [] };
        }),
        axios.get(`${API_URL}/usuarios`, { headers }).catch((err) => {
          console.error("Error fetching usuarios:", err.message);
          return { data: [] };
        }),
        axios.get(`${API_URL}/audit-logs`, { headers }).catch((err) => {
          console.error("Error fetching audit logs:", err.message);
          return { data: [] };
        }),
      ]);

      setTickets(tRes.data || []);
      setMaquinas(mRes.data || []);
      setUsuarios(uRes.data || []);
      setAuditLogs(aRes.data || []);
      setError(null);
    } catch (e) {
      console.error("Error in fetchAll:", e.message);
      setError("No se pudieron cargar los datos. Verifique su conexión.");
      Alert.alert("Error", "No se pudieron cargar los datos. Verifique su conexión.");
    }
  };

  const handleExportPDF = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "Debes iniciar sesión.");
        return;
      }
      const response = await axios.get(`${API_URL}/audit-logs/export/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      if (Platform.OS === 'web') {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        Alert.alert("Info", "Exportación a PDF no soportada en esta plataforma.");
      }
    } catch (e) {
      console.error("Error exporting PDF:", e.message);
      Alert.alert('Error', 'No se pudo exportar a PDF.');
    }
  };

  const handleExportExcel = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "Debes iniciar sesión.");
        return;
      }
      const response = await axios.get(`${API_URL}/audit-logs/export/excel`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      if (Platform.OS === 'web') {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        Alert.alert("Info", "Exportación a Excel no soportada en esta plataforma.");
      }
    } catch (e) {
      console.error("Error exporting Excel:", e.message);
      Alert.alert('Error', 'No se pudo exportar a Excel.');
    }
  };

  const handlePrint = () => {
    if (Platform.OS === 'web') {
      window.print();
    } else {
      Alert.alert("Info", "La impresión directa no está soportada en esta plataforma.");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Fecha no válida" : date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDetails = (details, log) => {
    const actionMap = {
      create: "Creó",
      update: "Actualizó",
      delete: "Eliminó",
    };
    const resourceMap = {
      maquinas: "una máquina",
      tickets: "un ticket",
      usuarios: "un usuario",
    };
    const action = actionMap[log.action] || "Realizó una acción en";
    const resource = resourceMap[log.resource] || "recurso desconocido";
    const resourceId = log.resource_id || "Desconocido";

    if (log.action === "create" || log.action === "delete") {
      return `${action} ${resource} con el ID: ${resourceId}`;
    } else if (log.action === "update" && details) {
      const oldData = details.old_data || {};
      const newData = details.new_data || {};
      let formattedDetails = `${action} ${resource} con el ID: ${resourceId}.\n`;
      formattedDetails += "Datos antiguos:\n";
      for (let key in oldData) {
        formattedDetails += `  - ${key}: ${JSON.stringify(oldData[key])}\n`;
      }
      formattedDetails += "Datos nuevos:\n";
      for (let key in newData) {
        formattedDetails += `  - ${key}: ${JSON.stringify(newData[key])}\n`;
      }
      return formattedDetails.trim();
    }
    return `${action} ${resource} con el ID: ${resourceId} (detalles no disponibles)`;
  };

  const tableData = auditLogs.map((log) => [
    log.id || 'N/A',
    log.user_name || `Usuario ${log.user_id || 'Desconocido'}`,
    `${log.action === 'create' ? 'Creó' : log.action === 'update' ? 'Actualizó' : 'Eliminó'} ${log.resource === 'maquinas' ? 'una máquina' : log.resource === 'tickets' ? 'un ticket' : 'un usuario'}`,
    log.rol || 'No disponible',
    formatDetails(log.details, log),
    formatDate(log.timestamp),
  ]);

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "Debes iniciar sesión.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const data = {
        id_impresora: parseInt(formData.id_impresora, 10),
        tipo_danio: formData.tipo_danio,
        reporte: formData.reporte,
        estado: formData.estado,
        is_active: formData.is_active,
      };

      if (editing) {
        await axios.put(`${API_URL}/tickets/${editing.id}`, data, { headers });
      } else {
        await axios.post(`${API_URL}/tickets`, data, { headers });
      }

      setVisible(false);
      setEditing(null);
      setFormData({
        id_impresora: "",
        tipo_danio: "",
        reporte: "",
        estado: "Pendiente",
        is_active: true,
      });
      fetchAll();
    } catch (e) {
      console.error("Error saving ticket:", e.message);
      Alert.alert("Error", "No se pudo guardar el ticket. Verifique los datos.");
    }
  };

  const handleSaveMaquina = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "Debes iniciar sesión.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const data = {
        impresora: formMaquina.impresora,
        no_serie: formMaquina.no_serie,
        edificio: formMaquina.edificio,
        oficina: formMaquina.oficina,
        estado: formMaquina.estado,
        is_active: formMaquina.is_active,
      };

      if (editingMaquina) {
        await axios.put(`${API_URL}/maquinas/${editingMaquina.id}`, data, { headers });
      } else {
        await axios.post(`${API_URL}/maquinas`, data, { headers });
      }

      setVisibleMaquina(false);
      setEditingMaquina(null);
      setFormMaquina({
        impresora: "",
        no_serie: "",
        edificio: "",
        oficina: "",
        estado: "Operativa",
        is_active: true,
      });
      fetchAll();
    } catch (e) {
      console.error("Error saving maquina:", e.message);
      Alert.alert("Error", "No se pudo guardar la máquina. Verifique los datos.");
    }
  };

  const handleSaveUsuario = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "Debes iniciar sesión.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const data = {
        usuario: formUsuario.usuario,
        contraseña: formUsuario.contraseña,
        rol: formUsuario.rol,
      };

      if (editingUsuario) {
        const updateData = { usuario: data.usuario, rol: data.rol };
        if (data.contraseña) {
          updateData.contraseña = data.contraseña;
        }
        await axios.put(`${API_URL}/usuarios/${editingUsuario.id}`, updateData, { headers });
      } else {
        await axios.post(`${API_URL}/usuarios`, data, { headers });
      }

      setVisibleUsuario(false);
      setEditingUsuario(null);
      setFormUsuario({ usuario: "", contraseña: "", rol: "tecnico" });
      fetchAll();
    } catch (e) {
      console.error("Error saving usuario:", e.message);
      Alert.alert("Error", "No se pudo guardar el usuario. Verifique los datos.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "Debes iniciar sesión.");
        return;
      }
      await axios.delete(`${API_URL}/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAll();
    } catch (e) {
      console.error("Error deleting ticket:", e.message);
      Alert.alert("Error", "No se pudo eliminar el ticket.");
    }
  };

  const handleDeleteMaquina = async (id) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "Debes iniciar sesión.");
        return;
      }
      await axios.delete(`${API_URL}/maquinas/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAll();
    } catch (e) {
      console.error("Error deleting maquina:", e.message);
      Alert.alert("Error", "No se pudo eliminar la máquina.");
    }
  };

  const handleDeleteUsuario = async (id) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "Debes iniciar sesión.");
        return;
      }
      await axios.delete(`${API_URL}/usuarios/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAll();
    } catch (e) {
      console.error("Error deleting usuario:", e.message);
      Alert.alert("Error", "No se pudo eliminar el usuario.");
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setFormData({
      id_impresora: item.id_impresora ? item.id_impresora.toString() : "",
      tipo_danio: item.tipo_danio || "",
      reporte: item.reporte || "",
      estado: item.estado || "Pendiente",
      is_active: item.is_active !== undefined ? item.is_active : true,
    });
    setVisible(true);
  };

  const handleEditMaquina = (item) => {
    setEditingMaquina(item);
    setFormMaquina({
      impresora: item.impresora || "",
      no_serie: item.no_serie || "",
      edificio: item.edificio || "",
      oficina: item.oficina || "",
      estado: item.estado || "Operativa",
      is_active: item.is_active !== undefined ? item.is_active : true,
    });
    setVisibleMaquina(true);
  };

  const handleEditUsuario = (item) => {
    setEditingUsuario(item);
    setFormUsuario({
      usuario: item.usuario || "",
      contraseña: "", // Do not pre-fill password for security
      rol: item.rol || "tecnico",
    });
    setVisibleUsuario(true);
  };

  return (
    <Provider theme={theme}>
      <View style={{ flex: 1 }}>
        <Appbar.Header>
          <Appbar.Content title="Administración de Tickets y Máquinas" />
        </Appbar.Header>

        <View style={styles.container}>
          <View style={styles.tabs}>
            <Button
              mode={tab === "tickets" ? "contained" : "outlined"}
              onPress={() => setTab("tickets")}
              style={{ marginRight: 8 }}
            >
              Tickets
            </Button>
            <Button
              mode={tab === "maquinas" ? "contained" : "outlined"}
              onPress={() => setTab("maquinas")}
              style={{ marginRight: 8 }}
            >
              Máquinas
            </Button>
            <Button
              mode={tab === "usuarios" ? "contained" : "outlined"}
              onPress={() => setTab("usuarios")}
              style={{ marginRight: 8 }}
            >
              Usuarios
            </Button>
            <Button
              mode={tab === "auditorias" ? "contained" : "outlined"}
              onPress={() => setTab("auditorias")}
            >
              Auditorías
            </Button>
          </View>

          <View style={styles.addButtons}>
            {tab === "tickets" && (
              <Button
                mode="contained"
                onPress={() => setVisible(true)}
                style={{ marginRight: 8 }}
              >
                Nuevo Ticket
              </Button>
            )}
            {tab === "maquinas" && (
              <Button mode="contained" onPress={() => setVisibleMaquina(true)}>
                Nueva Máquina
              </Button>
            )}
            {tab === "usuarios" && (
              <Button
                mode="contained"
                onPress={() => setVisibleUsuario(true)}
                style={{ marginRight: 8 }}
              >
                Nuevo Usuario
              </Button>
            )}
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {tab === "tickets" && (
            <FlatList
              data={tickets}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.row}>
                    <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                      {item.impresora_nombre || "Desconocida"}
                    </Text>
                    <Text>{formatDate(item.created_at)}</Text>
                  </View>
                  <Chip style={{ marginBottom: 8 }}>{item.tipo_danio || "Sin tipo de daño"}</Chip>
                  <Text>{item.reporte || "Sin reporte"}</Text>
                  <Text style={{ marginTop: 6 }}>
                    Estado: <Text style={{ fontWeight: "bold" }}>{item.estado || "Sin estado"}</Text>
                  </Text>
                  <View style={[styles.row, { marginTop: 10 }]}>
                    <Button
                      icon="pencil"
                      mode="outlined"
                      onPress={() => handleEdit(item)}
                      style={{ marginRight: 8 }}
                    >
                      Editar
                    </Button>
                    <Button
                      icon="delete"
                      mode="text"
                      onPress={() => handleDelete(item.id)}
                      textColor="red"
                    >
                      Eliminar
                    </Button>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay tickets disponibles.</Text>}
            />
          )}

          {tab === "maquinas" && (
            <FlatList
              data={maquinas}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text variant="titleMedium">{item.impresora || "Sin nombre"}</Text>
                  <Text>Serie: {item.no_serie || "Sin número de serie"}</Text>
                  <Text>{item.edificio || "Sin edificio"} - {item.oficina || "Sin oficina"}</Text>
                  <Text>Estado: {item.estado || "Sin estado"}</Text>
                  <View style={[styles.row, { marginTop: 10 }]}>
                    <Button
                      icon="pencil"
                      mode="outlined"
                      onPress={() => handleEditMaquina(item)}
                      style={{ marginRight: 8 }}
                    >
                      Editar
                    </Button>
                    <Button
                      icon="delete"
                      mode="text"
                      onPress={() => handleDeleteMaquina(item.id)}
                      textColor="red"
                    >
                      Eliminar
                    </Button>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay máquinas disponibles.</Text>}
            />
          )}

          {tab === "usuarios" && (
            <FlatList
              data={usuarios}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text variant="titleMedium">{item.usuario || "Sin usuario"}</Text>
                  <Text>Rol: {item.rol || "Sin rol"}</Text>
                  <View style={[styles.row, { marginTop: 10 }]}>
                    <Button
                      icon="pencil"
                      mode="outlined"
                      onPress={() => handleEditUsuario(item)}
                      style={{ marginRight: 8 }}
                    >
                      Editar
                    </Button>
                    <Button
                      icon="delete"
                      mode="text"
                      onPress={() => handleDeleteUsuario(item.id)}
                      textColor="red"
                    >
                      Eliminar
                    </Button>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay usuarios disponibles.</Text>}
            />
          )}

          {tab === "auditorias" && (
            <View style={{ flex: 1 }}>
              {auditLogs.length > 0 ? (
                <ScrollView style={styles.scrollView}>
                  <Table borderStyle={{ borderWidth: 1, borderColor: '#ddd' }}>
                    <Row
                      data={['ID', 'Nombre', 'Acción', 'Rol', 'Detalles', 'Fecha y Hora']}
                      style={styles.header}
                      textStyle={styles.headerText}
                      flexArr={[1, 1.5, 2, 1, 3, 2]}
                    />
                    <Rows
                      data={tableData}
                      textStyle={styles.text}
                      flexArr={[1, 1.5, 2, 1, 3, 2]}
                    />
                  </Table>
                  <View style={styles.exportButtons}>
                    <Button
                      mode="contained"
                      onPress={handleExportPDF}
                      style={{ marginRight: 8, flex: 1 }}
                    >
                      Exportar a PDF
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleExportExcel}
                      style={{ marginRight: 8, flex: 1 }}
                    >
                      Exportar a Excel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handlePrint}
                      style={{ flex: 1 }}
                    >
                      Imprimir
                    </Button>
                  </View>
                </ScrollView>
              ) : (
                <Text style={styles.emptyText}>No hay auditorías disponibles.</Text>
              )}
            </View>
          )}
        </View>

        <Portal>
          <Modal
            visible={visible}
            onDismiss={() => {
              setVisible(false);
              setEditing(null);
              setFormData({
                id_impresora: "",
                tipo_danio: "",
                reporte: "",
                estado: "Pendiente",
                is_active: true,
              });
            }}
            contentContainerStyle={styles.modal}
          >
            <Text variant="titleLarge" style={styles.modalTitle}>
              {editing ? "Editar Ticket" : "Nuevo Ticket"}
            </Text>
            <Text style={styles.label}>Impresora:</Text>
            <Picker
              selectedValue={formData.id_impresora}
              onValueChange={(val) => setFormData({ ...formData, id_impresora: val })}
              style={styles.picker}
            >
              <Picker.Item label="Seleccione una impresora" value="" />
              {maquinas.map((m) => (
                <Picker.Item key={m.id} label={m.impresora} value={m.id.toString()} />
              ))}
            </Picker>
            <TextInput
              label="Tipo de Daño"
              value={formData.tipo_danio}
              onChangeText={(text) => setFormData({ ...formData, tipo_danio: text })}
              style={styles.input}
            />
            <TextInput
              label="Reporte"
              value={formData.reporte}
              multiline
              numberOfLines={4}
              onChangeText={(text) => setFormData({ ...formData, reporte: text })}
              style={styles.input}
            />
            <Text style={styles.label}>Estado:</Text>
            <Picker
              selectedValue={formData.estado}
              onValueChange={(val) => setFormData({ ...formData, estado: val })}
              style={styles.picker}
            >
              <Picker.Item label="Pendiente" value="Pendiente" />
              <Picker.Item label="En proceso" value="En proceso" />
              <Picker.Item label="Resuelto" value="Resuelto" />
            </Picker>
            <Button
              mode="contained"
              onPress={handleSave}
              disabled={!formData.id_impresora || !formData.tipo_danio || !formData.reporte}
              style={styles.button}
            >
              {editing ? "Actualizar" : "Guardar"}
            </Button>
          </Modal>

          <Modal
            visible={visibleMaquina}
            onDismiss={() => {
              setVisibleMaquina(false);
              setEditingMaquina(null);
              setFormMaquina({
                impresora: "",
                no_serie: "",
                edificio: "",
                oficina: "",
                estado: "Operativa",
                is_active: true,
              });
            }}
            contentContainerStyle={styles.modal}
          >
            <Text variant="titleLarge" style={styles.modalTitle}>
              {editingMaquina ? "Editar Máquina" : "Nueva Máquina"}
            </Text>
            <TextInput
              label="Impresora"
              value={formMaquina.impresora}
              onChangeText={(text) => setFormMaquina({ ...formMaquina, impresora: text })}
              style={styles.input}
            />
            <TextInput
              label="Número de Serie"
              value={formMaquina.no_serie}
              onChangeText={(text) => setFormMaquina({ ...formMaquina, no_serie: text })}
              style={styles.input}
            />
            <TextInput
              label="Edificio"
              value={formMaquina.edificio}
              onChangeText={(text) => setFormMaquina({ ...formMaquina, edificio: text })}
              style={styles.input}
            />
            <TextInput
              label="Oficina"
              value={formMaquina.oficina}
              onChangeText={(text) => setFormMaquina({ ...formMaquina, oficina: text })}
              style={styles.input}
            />
            <Text style={styles.label}>Estado:</Text>
            <Picker
              selectedValue={formMaquina.estado}
              onValueChange={(val) => setFormMaquina({ ...formMaquina, estado: val })}
              style={styles.picker}
            >
              <Picker.Item label="Operativa" value="Operativa" />
              <Picker.Item label="En reparación" value="En reparación" />
              <Picker.Item label="Fuera de servicio" value="Fuera de servicio" />
              <Picker.Item label="En Mantenimiento" value="En Mantenimiento" />
            </Picker>
            <Button
              mode="contained"
              onPress={handleSaveMaquina}
              disabled={
                !formMaquina.impresora ||
                !formMaquina.no_serie ||
                !formMaquina.edificio ||
                !formMaquina.oficina
              }
              style={styles.button}
            >
              {editingMaquina ? "Actualizar" : "Guardar"}
            </Button>
          </Modal>

          <Modal
            visible={visibleUsuario}
            onDismiss={() => {
              setVisibleUsuario(false);
              setEditingUsuario(null);
              setFormUsuario({ usuario: "", contraseña: "", rol: "tecnico" });
            }}
            contentContainerStyle={styles.modal}
          >
            <Text variant="titleLarge" style={styles.modalTitle}>
              {editingUsuario ? "Editar Usuario" : "Nuevo Usuario"}
            </Text>
            <TextInput
              label="Usuario"
              value={formUsuario.usuario}
              onChangeText={(text) => setFormUsuario({ ...formUsuario, usuario: text })}
              style={styles.input}
            />
            <TextInput
              label="Contraseña"
              value={formUsuario.contraseña}
              secureTextEntry
              onChangeText={(text) => setFormUsuario({ ...formUsuario, contraseña: text })}
              style={styles.input}
              placeholder={editingUsuario ? "Dejar en blanco para no cambiar" : ""}
            />
            <Text style={styles.label}>Rol:</Text>
            <Picker
              selectedValue={formUsuario.rol}
              onValueChange={(val) => setFormUsuario({ ...formUsuario, rol: val })}
              style={styles.picker}
            >
              <Picker.Item label="Técnico" value="tecnico" />
              <Picker.Item label="Administrador" value="administrador" />
            </Picker>
            <Button
              mode="contained"
              onPress={handleSaveUsuario}
              disabled={!formUsuario.usuario || (!editingUsuario && !formUsuario.contraseña)}
              style={styles.button}
            >
              {editingUsuario ? "Actualizar" : "Guardar"}
            </Button>
          </Modal>
        </Portal>
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modal: {
    backgroundColor: "#fff",
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: Dimensions.get('window').height * 0.9,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: "center",
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
  },
  picker: {
    backgroundColor: "#fff",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 16,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  addButtons: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  exportButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingHorizontal: 8,
    flexWrap: "wrap",
  },
  scrollView: {
    flex: 1,
    marginBottom: 16,
  },
  header: {
    height: 50,
    backgroundColor: '#f5f5f5',
  },
  headerText: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
  text: {
    textAlign: 'center',
    padding: 8,
    fontSize: 12,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
});

export default AdministradorScreen;