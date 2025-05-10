import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View, Alert } from "react-native";
import {
  Appbar,
  Button,
  Chip,
  Modal,
  Portal,
  Provider,
  Text,
  TextInput,
} from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import ImpresorasScreen from "./ImpresorasScreen";
import { Config } from "../constants/config";

interface Ticket {
  id: number;
  idImpresora: number;
  tipoDanio: string;
  reporte: string;
  estado: "Pendiente" | "En proceso" | "Resuelto";
  isActive: boolean;
  createdAt: string;
  modifiedAt: string;
  impresora?: { id: number; impresora: string };
}

interface Maquina {
  id: number;
  impresora: string;
  noSerie: string;
  edificio: string;
  oficina: string;
  estado: "Operativa" | "En reparación" | "Fuera de servicio";
  isActive: boolean;
  createdAt: string;
  modifiedAt: string;
}

const UsuarioScreen = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [visible, setVisible] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState<"tickets" | "maquinas" | "reportes">("tickets");
  const [loading, setLoading] = useState(false);

  const [ticketData, setTicketData] = useState({
    idImpresora: "", // Cambiado a string para el formulario
    tipoDanio: "",
    reporte: "",
    estado: "Pendiente" as "Pendiente" | "En proceso" | "Resuelto",
    isActive: true,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  });

  useEffect(() => {
    fetchTickets();
    fetchMaquinas();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await axios.get<Ticket[]>(`${Config.API_URL}/tickets`);
      setTickets(response.data);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los tickets. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMaquinas = async () => {
    setLoading(true);
    try {
      const response = await axios.get<Maquina[]>(`${Config.API_URL}/maquinas`);
      setMaquinas(response.data);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las máquinas. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const idImpresoraNumber = parseInt(ticketData.idImpresora);
      if (isNaN(idImpresoraNumber)) {
        Alert.alert("Error", "Por favor selecciona una impresora válida.");
        setLoading(false);
        return;
      }

      const data: Ticket = {
        id: editingTicket?.id || 0,
        idImpresora: idImpresoraNumber, // Convertido a número aquí
        tipoDanio: ticketData.tipoDanio,
        reporte: ticketData.reporte,
        estado: ticketData.estado,
        isActive: ticketData.isActive,
        createdAt: editingTicket ? ticketData.createdAt : new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      };

      if (editingTicket) {
        await axios.put(`${Config.API_URL}/tickets/${editingTicket.id}`, data);
      } else {
        await axios.post(`${Config.API_URL}/tickets`, data);
      }

      fetchTickets();
      setVisible(false);
      setEditingTicket(null);
      setTicketData({
        idImpresora: "",
        tipoDanio: "",
        reporte: "",
        estado: "Pendiente",
        isActive: true,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el ticket. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setTicketData({
      idImpresora: ticket.idImpresora.toString(), // Convertido a string para el formulario
      tipoDanio: ticket.tipoDanio,
      reporte: ticket.reporte,
      estado: ticket.estado,
      isActive: ticket.isActive,
      createdAt: ticket.createdAt,
      modifiedAt: ticket.modifiedAt,
    });
    setVisible(true);
  };

  const formatDate = (dateString: string) => {
    const options = {
      year: "numeric" as const,
      month: "short" as const,
      day: "numeric" as const,
      hour: "2-digit" as const,
      minute: "2-digit" as const,
    };
    return new Date(dateString).toLocaleDateString("es-ES", options);
  };

  return (
    <Provider>
      <View style={styles.container}>
        <StatusBar style="auto" />
        <Appbar.Header>
          <Appbar.Content title="Gestión de Tickets" />
        </Appbar.Header>

        <View style={styles.content}>
          {activeTab === "tickets" && (
            <FlatList
              data={tickets}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.ticketCard}>
                  <View style={styles.cardHeader}>
                    <Text variant="titleMedium">
                      {maquinas.find((m) => m.id === item.idImpresora)?.impresora || "Desconocida"}
                    </Text>
                    <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
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
                    {item.tipoDanio}
                  </Chip>

                  <Text style={{ marginBottom: 8 }} numberOfLines={3}>
                    {item.reporte}
                  </Text>

                  <Button
                    mode="outlined"
                    onPress={() => handleEdit(item)}
                    style={{ marginTop: 8 }}
                    icon="pencil"
                    compact
                    disabled={loading}
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
                  idImpresora: "",
                  tipoDanio: "",
                  reporte: "",
                  estado: "Pendiente",
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  modifiedAt: new Date().toISOString(),
                });
              }}
              contentContainerStyle={styles.modalContainer}
            >
              <Text variant="titleMedium" style={{ marginBottom: 20 }}>
                {editingTicket ? "Editar Ticket" : "Nuevo Ticket"}
              </Text>

              <Text style={{ marginBottom: 8 }}>Impresora:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={ticketData.idImpresora}
                  onValueChange={(value) =>
                    setTicketData({ ...ticketData, idImpresora: value })
                  }
                  style={styles.picker}
                  enabled={false}
                >
                  <Picker.Item label="Selecciona una impresora" value="" />
                  {maquinas.map((m) => (
                    <Picker.Item key={m.id} label={`${m.impresora} - ${m.noSerie}`} value={m.id.toString()} />
                  ))}
                </Picker>
              </View>

              <TextInput
                label="Tipo de Daño"
                value={ticketData.tipoDanio}
                onChangeText={(text) => setTicketData({ ...ticketData, tipoDanio: text })}
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
                  onValueChange={(value: "Pendiente" | "En proceso" | "Resuelto") =>
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
                  !ticketData.idImpresora || !ticketData.tipoDanio || !ticketData.reporte || loading
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
            <Icon name="ticket" size={24} color={activeTab === "tickets" ? "#6200ee" : "#888"} />
            <Text style={styles.navText}>Tickets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={activeTab === "maquinas" ? styles.navButtonActive : styles.navButton}
            onPress={() => setActiveTab("maquinas")}
          >
            <Icon name="printer" size={24} color={activeTab === "maquinas" ? "#6200ee" : "#888"} />
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