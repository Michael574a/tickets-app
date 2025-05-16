import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { Buffer } from 'buffer';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from "react";
import { Alert, Dimensions, FlatList, Platform, ScrollView, StyleSheet, View } from "react-native";
import {
  Appbar,
  Button,
  Chip,
  Menu,
  Modal,
  Portal,
  Provider,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { Row, Table } from "react-native-table-component";
import * as XLSX from 'xlsx';

const API_URL = Platform.OS === 'web' ? "http://localhost:5000" : "http://192.168.101.8:5000";

const AdministradorScreen = () => {
  const theme = useTheme();
  const [tab, setTab] = useState("tickets"); 


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

  // State to manage expanded rows in audit logs
  const [expandedRows, setExpandedRows] = useState({});

  // State for export menu
  const [menuVisible, setMenuVisible] = useState(false);

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
    setMenuVisible(false);
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "Debes iniciar sesión.");
        return;
      }
      const response = await axios.get(`${API_URL}/audit-logs/export/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer',
      });

      if (Platform.OS === 'web') {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (Platform.OS === 'android') {
        // Guardar y compartir en Android
        const fileName = `audit_logs_${new Date().toISOString().split('T')[0]}.pdf`;
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(
          fileUri,
          Buffer.from(response.data).toString('base64'),
          { encoding: FileSystem.EncodingType.Base64 }
        );
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/pdf",
          dialogTitle: "Compartir o guardar reporte de auditoría",
          UTI: "com.adobe.pdf",
        });
        Alert.alert("Reporte generado", "El archivo PDF se ha generado. Si deseas guardarlo, selecciona la opción adecuada en el menú.");
      } else {
        Alert.alert("No soportado", "La descarga de archivos PDF solo está disponible en Android y Web.");
      }
    } catch (e) {
      console.error("Error exporting PDF:", e.message);
      Alert.alert('Error', 'No se pudo exportar a PDF.');
    }
  };

  const handleExportExcel = async () => {
    setMenuVisible(false);
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "Debes iniciar sesión.");
        return;
      }
      const response = await axios.get(`${API_URL}/audit-logs/export/excel`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer',
      });

      if (Platform.OS === 'web') {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (Platform.OS === 'android') {
        // Guardar y compartir en Android
        const fileName = `audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`;
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(
          fileUri,
          Buffer.from(response.data).toString('base64'),
          { encoding: FileSystem.EncodingType.Base64 }
        );
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Compartir o guardar reporte de auditoría",
          UTI: "com.microsoft.excel.xlsx",
        });
        Alert.alert("Reporte generado", "El archivo Excel se ha generado. Si deseas guardarlo, selecciona la opción adecuada en el menú.");
      } else {
        Alert.alert("No soportado", "La descarga de archivos Excel solo está disponible en Android y Web.");
      }
    } catch (e) {
      console.error("Error exporting Excel:", e.message);
      Alert.alert('Error', 'No se pudo exportar a Excel.');
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

  const formatSummary = (log) => {
    const actionMap = {
      create: "Se creó",
      update: "Se actualizó",
      delete: "Se eliminó",
    };
    const resourceMap = {
      maquinas: "la máquina",
      tickets: "el ticket",
      usuarios: "el usuario",
    };
    const action = actionMap[log.action] || "Se realizó una acción en";
    const resource = resourceMap[log.resource] || "recurso desconocido";
    const resourceId = log.resource_id || "Desconocido";

    return `${action} ${resource} con el ID: ${resourceId}`;
  };

  const toggleRowExpansion = (logId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [logId]: !prev[logId],
    }));
  };

  const renderDetailsTable = (details, log) => {
    if (!details) {
      return (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsText}>Detalles no disponibles</Text>
        </View>
      );
    }

    const parsedDetails = typeof details === 'string' ? JSON.parse(details) : details;
    const oldData = parsedDetails.old_data || {};
    const newData = parsedDetails.new_data || {};

    if (log.action === "create") {
      const allKeys = Object.keys(newData);
      const tableData = allKeys.map((key) => [
        key,
        "-",
        newData[key] !== undefined ? JSON.stringify(newData[key]) : "-",
      ]);

      return (
        <View style={styles.detailsContainer}>
          <Table borderStyle={{ borderWidth: 1, borderColor: '#ddd' }}>
            <Row
              data={['Campo', 'Datos Antiguos', 'Datos Nuevos']}
              style={styles.detailsHeader}
              textStyle={styles.detailsHeaderText}
              flexArr={[1, 2, 2]}
            />
            {tableData.map((row, index) => (
              <Row
                key={index}
                data={row}
                style={styles.detailsRow}
                textStyle={styles.detailsText}
                flexArr={[1, 2, 2]}
              />
            ))}
          </Table>
        </View>
      );
    }

    if (log.action === "delete") {
      const allKeys = Object.keys(oldData);
      const tableData = allKeys.map((key) => [
        key,
        oldData[key] !== undefined ? JSON.stringify(oldData[key]) : "-",
        "-",
      ]);

      return (
        <View style={styles.detailsContainer}>
          <Table borderStyle={{ borderWidth: 1, borderColor: '#ddd' }}>
            <Row
              data={['Campo', 'Datos Antiguos', 'Datos Nuevos']}
              style={styles.detailsHeader}
              textStyle={styles.detailsHeaderText}
              flexArr={[1, 2, 2]}
            />
            {tableData.map((row, index) => (
              <Row
                key={index}
                data={row}
                style={styles.detailsRow}
                textStyle={styles.detailsText}
                flexArr={[1, 2, 2]}
              />
            ))}
          </Table>
        </View>
      );
    }

    if (log.action === "update" && oldData && newData) {
      const allKeys = [...new Set([...Object.keys(oldData), ...Object.keys(newData)])];
      const tableData = allKeys.map((key) => [
        key,
        oldData[key] !== undefined ? JSON.stringify(oldData[key]) : "-",
        newData[key] !== undefined ? JSON.stringify(newData[key]) : "-",
      ]);

      return (
        <View style={styles.detailsContainer}>
          <Table borderStyle={{ borderWidth: 1, borderColor: '#ddd' }}>
            <Row
              data={['Campo', 'Datos Antiguos', 'Datos Nuevos']}
              style={styles.detailsHeader}
              textStyle={styles.detailsHeaderText}
              flexArr={[1, 2, 2]}
            />
            {tableData.map((row, index) => (
              <Row
                key={index}
                data={row}
                style={styles.detailsRow}
                textStyle={styles.detailsText}
                flexArr={[1, 2, 2]}
              />
            ))}
          </Table>
        </View>
      );
    }

    return (
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsText}>Detalles no disponibles</Text>
      </View>
    );
  };

  const tableData = auditLogs.map((log) => ({
    id: log.id || '-',
    userName: log.user_name || `Usuario ${log.user_id || 'Desconocido'}`,
    action: `${log.action === 'create' ? 'Creó' : log.action === 'update' ? 'Actualizó' : 'Eliminó'} ${log.resource === 'maquinas' ? 'una máquina' : log.resource === 'tickets' ? 'un ticket' : 'un usuario'}`,
    role: log.rol || '-',
    summary: formatSummary(log),
    details: log.details,
    timestamp: formatDate(log.timestamp),
  }));

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
const fetchUsuarios = async () => {
  try {
    const res = await axios.get(`${API_URL}/usuarios`);
    setUsuarios(res.data);
  } catch (e) {
    console.error("Error al cargar usuarios:", e);
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
      contraseña: "",
      rol: item.rol || "tecnico",
    });
    setVisibleUsuario(true);
  };

  const exportTicketsToExcel = async () => {
    try {
      // Prepara los datos con la fecha de creación
      const data = tickets.map(ticket => ({
        "ID Ticket": ticket.id,
        "Nombre impresora": ticket.impresora_nombre || "",
        "Tipo de Daño": ticket.tipo_danio,
        "Reporte": ticket.reporte,
        "Estado": ticket.estado,
        "Fecha de Creación": formatDate(ticket.created_at),
      }));

      // Crea la hoja y el libro
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tickets");

      // Convierte a base64
      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

      // Detecta plataforma
      if (Platform.OS === "android") {
        // Guarda el archivo en el almacenamiento externo (Downloads)
        const fileName = "reporte_tickets.xlsx";
        const fileUri = FileSystem.documentDirectory + fileName;

        await FileSystem.writeAsStringAsync(fileUri, wbout, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Intenta compartir el archivo (abre menú de compartir, que incluye guardar en archivos)
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Compartir o guardar reporte de tickets",
          UTI: "com.microsoft.excel.xlsx",
        });

        Alert.alert(
          "Reporte generado",
          "El archivo Excel se ha generado. Si deseas guardarlo, selecciona la opción adecuada en el menú."
        );
      } else if (Platform.OS === "web") {
          // Convierte el archivo a un Blob y crea un enlace de descarga
          const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
          const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "reporte_tickets.xlsx";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          return;
        }else {
        Alert.alert(
          "No soportado",
          "La descarga de archivos Excel solo está disponible en Android."
        );
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo generar el reporte.");
      console.error(e);
    }
  };

  return (
    <Provider theme={theme}>
      <View style={{ flex: 1 }}>
        <Appbar.Header>
          <Appbar.Content title="Administración de Tickets y Máquinas" />
          
          {tab === "tickets" && (
            <Appbar.Action icon="refresh" onPress={fetchAll} />
          )}
          {tab === "maquinas" && (
            <Appbar.Action icon="refresh" onPress={fetchAll} />
          )}
          {tab === "usuarios" && (
            <Appbar.Action icon="refresh" onPress={fetchUsuarios} />
          )}
        </Appbar.Header>

        <View style={styles.container}>
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tabs}>
                <Button
                  mode={tab === "tickets" ? "contained" : "outlined"}
                  onPress={() => setTab("tickets")}
                  style={styles.tabButton}
                >
                  Tickets
                </Button>
                <Button
                  mode={tab === "maquinas" ? "contained" : "outlined"}
                  onPress={() => setTab("maquinas")}
                  style={styles.tabButton}
                >
                  Máquinas
                </Button>
                <Button
                  mode={tab === "usuarios" ? "contained" : "outlined"}
                  onPress={() => setTab("usuarios")}
                  style={styles.tabButton}
                >
                  Usuarios
                </Button>
                <Button
                  mode={tab === "auditorias" ? "contained" : "outlined"}
                  onPress={() => setTab("auditorias")}
                  style={styles.tabButton}
                >
                  Auditorías
                </Button>
              </View>
            </ScrollView>
          </View>

          <View style={styles.addButtons}>
            {tab === "tickets" && (
              <Button
                mode="contained"
                onPress={() => setVisible(true)}
                style={{ marginRight: 5 }}
                buttonColor="#6989ff" 
                
                
              >
                Nuevo Ticket
              </Button>
            )}
            {tab === "maquinas" && (
              <Button
                mode="contained"
                onPress={() => setVisibleMaquina(true)}
                buttonColor="#6989ff"
              >
                Nueva Máquina
              </Button>
            )}
            {tab === "usuarios" && (
              <Button
                mode="contained"
                onPress={() => setVisibleUsuario(true)}
                style={{ marginRight: 8 }}
                buttonColor="#6989ff"
              >
                Nuevo Usuario
              </Button>
            )}
            {tab === "auditorias" && (
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Button
                    mode="contained"
                    onPress={() => setMenuVisible(true)}
                    style={{ marginLeft: 8 }}
                  >
                    Exportar/Imprimir
                  </Button>
                }
              >
                <Menu.Item onPress={handleExportPDF} title="Exportar a PDF" />
                <Menu.Item onPress={handleExportExcel} title="Exportar a Excel" />
              </Menu>
            )}
            {tab === "tickets" && (
              <Button
                mode="outlined"
                icon="file-excel"
                onPress={exportTicketsToExcel}
                style={{ marginLeft: 8 }}
              >
                Reporte Tickets
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
                Platform.OS === "web" ? (
                  // Web: Scroll vertical como antes
                  <ScrollView style={styles.scrollView}>
                    <Table borderStyle={{ borderWidth: 1, borderColor: '#ddd' }}>
                      <Row
                        data={['ID', 'Usuario', 'Acción', 'Rol', 'Resumen', 'Fecha y Hora']}
                        style={styles.header}
                        textStyle={styles.headerText}
                        flexArr={[1, 1.5, 2, 1, 3, 2]}
                      />
                      {tableData.map((item, index) => (
                        <View key={item.id}>
                          <Row
                            data={[
                              item.id,
                              item.userName,
                              item.action,
                              item.role,
                              <View style={styles.summaryContainer}>
                                <Text style={styles.summaryText}>{item.summary}</Text>
                                <Button
                                  mode="text"
                                  onPress={() => toggleRowExpansion(item.id)}
                                  style={styles.detailsButton}
                                >
                                  {expandedRows[item.id] ? "Ocultar Detalles" : "Mostrar Detalles"}
                                </Button>
                              </View>,
                              item.timestamp,
                            ]}
                            textStyle={styles.text}
                            flexArr={[1, 1.5, 2, 1, 3, 2]}
                          />
                          {expandedRows[item.id] && (
                            <View style={styles.expandedRow}>
                              {renderDetailsTable(item.details, {
                                action: auditLogs[index].action,
                                resource_id: auditLogs[index].resource_id,
                              })}
                            </View>
                          )}
                        </View>
                      ))}
                    </Table>
                  </ScrollView>
                ) : (
                  // Android/iOS: Scroll horizontal + vertical
                  <ScrollView horizontal style={{ flex: 1 }}>
                    <ScrollView style={styles.scrollView}>
                      <Table borderStyle={{ borderWidth: 1, borderColor: '#ddd' }}>
                        <Row
                          data={['ID', 'Usuario', 'Acción', 'Rol', 'Resumen', 'Fecha y Hora']}
                          style={styles.header}
                          textStyle={styles.headerText}
                          flexArr={[1, 1.5, 2, 1, 3, 2]}
                        />
                        {tableData.map((item, index) => (
                          <View key={item.id}>
                            <Row
                              data={[
                                item.id,
                                item.userName,
                                item.action,
                                item.role,
                                <View style={styles.summaryContainer}>
                                  <Text style={styles.summaryText}>{item.summary}</Text>
                                  <Button
                                    mode="text"
                                    onPress={() => toggleRowExpansion(item.id)}
                                    style={styles.detailsButton}
                                  >
                                    {expandedRows[item.id] ? "Ocultar Detalles" : "Mostrar Detalles"}
                                  </Button>
                                </View>,
                                item.timestamp,
                              ]}
                              textStyle={styles.text}
                              flexArr={[1, 1.5, 2, 1, 3, 2]}
                            />
                            {expandedRows[item.id] && (
                              <View style={styles.expandedRow}>
                                {renderDetailsTable(item.details, {
                                  action: auditLogs[index].action,
                                  resource_id: auditLogs[index].resource_id,
                                })}
                              </View>
                            )}
                          </View>
                        ))}
                      </Table>
                    </ScrollView>
                  </ScrollView>
                )
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
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 16,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 10,
    justifyContent: "center",
    flexWrap: "wrap",
    
  },
  tabButton: {
    marginRight: 2,
   
    
  },
  addButtons: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 16,
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
  summaryContainer: {
    padding: 8,
  },
  summaryText: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailsButton: {
    marginTop: 4,
  },
  expandedRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
  },
  detailsContainer: {
    padding: 8,
  },
  detailsHeader: {
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  detailsHeaderText: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 12,
  },
  detailsRow: {
    height: 40,
  },
  detailsText: {
    textAlign: 'center',
    fontSize: 12,
    padding: 4,
  },
});

export default AdministradorScreen;