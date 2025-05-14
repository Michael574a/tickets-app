import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
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
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import ImpresorasScreen from "./ImpresorasScreen";

//const API_URL = "http://45.70.15.5:5000";
const API_URL = "http://localhost:5000";
const UsuarioScreen = () => {
  const theme = useTheme();
  const [tickets, setTickets] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [visible, setVisible] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [activeTab, setActiveTab] = useState("tickets");

  const [ticketData, setTicketData] = useState({
    id_impresora: "",
    tipo_danio: "",
    reporte: "",
    estado: "Pendiente",
    is_active: true,
    created_at: new Date().toISOString(),
    modified_at: new Date().toISOString(),
  });

  useEffect(() => {
    fetchTickets();
    fetchMaquinas();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`${API_URL}/tickets`);
      setTickets(response.data);
    } catch (error) {
      console.error("Error al obtener tickets:", error);
    }
  };

  const fetchMaquinas = async () => {
    try {
      const response = await axios.get(`${API_URL}/maquinas`);
      setMaquinas(response.data);
    } catch (error) {
      console.error("Error al obtener máquinas:", error);
    }
  };

  const handleSave = async () => {
    try {
          console.log("Datos enviados al servidor:", ticketData); // Verifica los datos

      if (editingTicket) {
        await axios.put(`${API_URL}/tickets/${editingTicket.id}`, ticketData);
      } else {
        await axios.post(`${API_URL}/tickets`, ticketData);
      }
      fetchTickets();
      setVisible(false);
      setEditingTicket(null);
      setTicketData({
        id_impresora: "",
        tipo_danio: "",
        reporte: "",
        estado: "Pendiente",
        is_active: true,
        created_at: new Date().toISOString(),
        modified_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error al guardar ticket:", error);
    }
  };

  const handleEdit = (ticket) => {
    setEditingTicket(ticket);
    setTicketData({
      ...ticket,
      modified_at: new Date().toISOString(),
    });
    setVisible(true);
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("es-ES", options);
  };

  return (
    <Provider theme={theme}>
      <View style={styles.container}>
        <StatusBar style={theme.dark ? "light" : "dark"} />
        <Appbar.Header>
          <Appbar.Content title="Gestión de Tickets" />
        </Appbar.Header>

        <View style={styles.content}>
          {activeTab === "tickets" && (
            <FlatList
              data={tickets}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.ticketCard}>
                  <View style={styles.cardHeader}>
                    <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                      {maquinas.find((m) => m._id === item.id_impresora?._id)?.impresora || "Desconocida"}
                    </Text>
                    <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                  </View>

                  <View style={styles.statusContainer}>
                    <Icon
                      name="alert-circle"
                      size={16}
                      color={
                        item.estado === "Pendiente"
                          ? "#ff9800"
                          : item.estado === "En proceso"
                          ? "#2196f3"
                          : "#4caf50"
                      }
                    />
                    <Text style={{ marginLeft: 8 }}>{item.estado}</Text>
                  </View>

                  <Chip mode="outlined" style={{ alignSelf: "flex-start", marginBottom: 8 }}>
                    {item.tipo_danio}
                  </Chip>

                  <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }} numberOfLines={3}>
                    {item.reporte}
                  </Text>

                  <Button
                    mode="outlined"
                    onPress={() => handleEdit(item)}
                    style={{ marginTop: 8 }}
                    icon="pencil"
                    compact
                  >
                    Editar
                  </Button>
                </View>
              )}
            />
          )}

          {activeTab === "maquinas" && <ImpresorasScreen />}

          {activeTab === "reportes" && (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <Text>Pantalla de Reportes</Text>
            </View>
          )}

          <Portal>
            <Modal
              visible={visible}
              onDismiss={() => {
                setVisible(false);
                setEditingTicket(null);
                setTicketData({
                  id_impresora: "",
                  tipo_danio: "",
                  reporte: "",
                  estado: "Pendiente",
                  is_active: true,
                  created_at: new Date().toISOString(),
                  modified_at: new Date().toISOString(),
                });
              }}
              contentContainerStyle={styles.modalContainer}
            >
              <Text variant="titleMedium" style={{ marginBottom: 20, color: theme.colors.primary }}>
                {editingTicket ? "Editar Ticket" : "Nuevo Ticket"}
              </Text>

              <Text style={{ marginBottom: 8 }}>Impresora:</Text>
              <View style={styles.pickerContainer}>
                <Picker
  selectedValue={ticketData.id_impresora} 
  onValueChange={(val) => setTicketData({ ...ticketData, id_impresora: val })}disabled
  style={{ backgroundColor: "#fff", marginBottom: 16 }}
>
  <Picker.Item label="Seleccione una impresora" value="" />
  {maquinas.map((m) => (
    <Picker.Item key={m.id} label={m.impresora} value={m.id} />
  ))}
</Picker>
              </View>

              <TextInput
                label="Tipo de Daño"
                value={ticketData.tipo_danio}
                onChangeText={(text) => setTicketData({ ...ticketData, tipo_danio: text })}
                style={{ marginBottom: 16 }}
                disabled
              />

              <TextInput
                label="Reporte"
                multiline
                numberOfLines={4}
                value={ticketData.reporte}
                onChangeText={(text) => setTicketData({ ...ticketData, reporte: text })}
                style={{ marginBottom: 16 }}
              />

              <Text style={{ marginBottom: 8 }}>Estado:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={ticketData.estado}
                  onValueChange={(value) =>
                    setTicketData({ ...ticketData, estado: value })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Pendiente" value="Pendiente" />
                  <Picker.Item label="En proceso" value="En proceso" />
                  <Picker.Item label="Resuelto" value="Resuelto" />
                </Picker>
              </View>

              <Button
                mode="contained"
                onPress={handleSave}
                style={{ marginTop: 16 }}
                disabled={
                  !ticketData.id_impresora || !ticketData.tipo_danio || !ticketData.reporte
                }
              >
                {editingTicket ? "Actualizar" : "Crear"}
              </Button>
            </Modal>
          </Portal>
        </View>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={activeTab === "tickets" ? styles.navButtonActive : styles.navButton}
            onPress={() => setActiveTab("tickets")}
          >
            <Icon name="ticket" size={24} color={activeTab === "tickets" ? theme.colors.primary : theme.colors.onSurface} />
            <Text style={styles.navText}>Tickets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={activeTab === "maquinas" ? styles.navButtonActive : styles.navButton}
            onPress={() => setActiveTab("maquinas")}
          >
            <Icon name="printer" size={24} color={activeTab === "maquinas" ? theme.colors.primary : theme.colors.onSurface} />
            <Text style={styles.navText}>Máquinas</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Provider>
  );
};

export default UsuarioScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  ticketCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
  },
  modalContainer: {
    padding: 20,
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginBottom: 16,
    overflow: "hidden",
  },
  picker: {
    backgroundColor: "#fff",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    backgroundColor: "#f9f9f9",
  },
  navButton: { alignItems: "center" },
  navButtonActive: {
    alignItems: "center",
    borderTopWidth: 2,
    borderTopColor: "#6200ee",
    paddingTop: 10,
  },
  navText: { marginTop: 4, fontSize: 12 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dateText: { fontSize: 12, color: "#888" },
  statusContainer: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
});
