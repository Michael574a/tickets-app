import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
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

const API_URL = "http://45.70.15.5:5000";

const AdministradorScreen = () => {
  const theme = useTheme();
  const [tab, setTab] = useState("tickets");

  const [tickets, setTickets] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  const [formData, setFormData] = useState({
    idImpresora: "",
    tipoDanio: "",
    reporte: "",
    estado: "Pendiente",
    isActive: true,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  });

  const [visibleMaquina, setVisibleMaquina] = useState(false);
  const [editingMaquina, setEditingMaquina] = useState(null);

  const [formMaquina, setFormMaquina] = useState({
    impresora: "",
    noSerie: "",
    edificio: "",
    oficina: "",
    estado: "Operativa",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [tRes, mRes] = await Promise.all([
        axios.get(`${API_URL}/tickets`),
        axios.get(`${API_URL}/maquinas`),
      ]);
      setTickets(tRes.data);
      setMaquinas(mRes.data);
    } catch (e) {
      console.error("Error al cargar datos:", e);
    }
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        modifiedAt: new Date().toISOString(),
        createdAt: editing ? formData.createdAt : new Date().toISOString(),
      };

      if (editing) {
        await axios.put(`${API_URL}/tickets/${editing._id}`, data);
      } else {
        await axios.post(`${API_URL}/tickets`, data);
      }

      setVisible(false);
      setEditing(null);
      setFormData({
        idImpresora: "",
        tipoDanio: "",
        reporte: "",
        estado: "Pendiente",
        isActive: true,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      });
      fetchAll();
    } catch (e) {
      console.error("Error al guardar:", e);
    }
  };

  const handleSaveMaquina = async () => {
    try {
      const data = {
        ...formMaquina,
      };

      if (editingMaquina) {
        await axios.put(`${API_URL}/maquinas/${editingMaquina._id}`, data);
      } else {
        await axios.post(`${API_URL}/maquinas`, data);
      }

      setVisibleMaquina(false);
      setEditingMaquina(null);
      setFormMaquina({
        impresora: "",
        noSerie: "",
        edificio: "",
        oficina: "",
        estado: "Operativa",
      });
      fetchAll();
    } catch (e) {
      console.error("Error al guardar máquina:", e);
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setFormData({ ...item });
    setVisible(true);
  };

  const handleEditMaquina = (item) => {
    setEditingMaquina(item);
    setFormMaquina({ ...item });
    setVisibleMaquina(true);
  };

  const handleDelete = (id) => {
    Alert.alert("Eliminar", "¿Deseas eliminar este registro?", [
      { text: "Cancelar" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/tickets/${id}`);
            fetchAll();
          } catch (e) {
            console.error("Error al eliminar:", e);
          }
        },
      },
    ]);
  };

  const handleDeleteMaquina = (id) => {
    Alert.alert("Eliminar", "¿Deseas eliminar esta máquina?", [
      { text: "Cancelar" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/maquinas/${id}`);
            fetchAll();
          } catch (e) {
            console.error("Error al eliminar máquina:", e);
          }
        },
      },
    ]);
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Provider theme={theme}>
      <View style={{ flex: 1 }}>
        <Appbar.Header>
          <Appbar.Content title="CRUD Tickets y Máquinas" />
        </Appbar.Header>

        <View style={{ flex: 1, padding: 12 }}>
          <View style={styles.tabs}>
            <Button
              mode={tab === "tickets" ? "contained" : "outlined"}
              onPress={() => setTab("tickets")}
            >
              Tickets
            </Button>
            <Button
              mode={tab === "maquinas" ? "contained" : "outlined"}
              onPress={() => setTab("maquinas")}
              style={{ marginLeft: 8 }}
            >
              Máquinas
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
              <Button
                mode="contained"
                onPress={() => setVisibleMaquina(true)}
              >
                Nueva Máquina
              </Button>
            )}
          </View>

          {tab === "tickets" && (
            <FlatList
              data={tickets}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.row}>
                    <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                      {maquinas.find((m) => m._id === item.idImpresora?._id)?.impresora || "Desconocida"}
                    </Text>
                    <Text>{formatDate(item.createdAt)}</Text>
                  </View>

                  <Chip style={{ marginBottom: 8 }}>{item.tipoDanio}</Chip>
                  <Text>{item.reporte}</Text>
                  <Text style={{ marginTop: 6 }}>
                    Estado: <Text style={{ fontWeight: "bold" }}>{item.estado}</Text>
                  </Text>

                  <View style={[styles.row, { marginTop: 10 }]}>
                    <Button icon="pencil" mode="outlined" onPress={() => handleEdit(item)}>
                      Editar
                    </Button>
                    <Button icon="delete" mode="text" onPress={() => handleDelete(item._id)} textColor="red">
                      Eliminar
                    </Button>
                  </View>
                </View>
              )}
            />
          )}

          {tab === "maquinas" && (
            <FlatList
              data={maquinas}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text variant="titleMedium">{item.impresora}</Text>
                  <Text>Serie: {item.noSerie}</Text>
                  <Text>
                    {item.edificio} - {item.oficina}
                  </Text>
                  <Text>Estado: {item.estado}</Text>

                  <View style={[styles.row, { marginTop: 10 }]}>
                    <Button icon="pencil" mode="outlined" onPress={() => handleEditMaquina(item)}>
                      Editar
                    </Button>
                    <Button icon="delete" mode="text" onPress={() => handleDeleteMaquina(item._id)} textColor="red">
                      Eliminar
                    </Button>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        <Portal>
          <Modal visible={visible} onDismiss={() => { setVisible(false); setEditing(null); }} contentContainerStyle={styles.modal}>
            <Text variant="titleMedium" style={{ marginBottom: 16 }}>
              {editing ? "Editar Ticket" : "Nuevo Ticket"}
            </Text>

            <Text style={{ marginBottom: 8 }}>Impresora:</Text>
            <Picker
              selectedValue={formData.idImpresora?._id || formData.idImpresora}
              onValueChange={(val) => setFormData({ ...formData, idImpresora: val })}
              style={{ backgroundColor: "#fff", marginBottom: 16 }}
            >
              <Picker.Item label="Seleccione una impresora" value="" />
              {maquinas.map((m) => (
                <Picker.Item key={m._id} label={m.impresora} value={m._id} />
              ))}
            </Picker>

            <TextInput
              label="Tipo de Daño"
              value={formData.tipoDanio}
              onChangeText={(text) => setFormData({ ...formData, tipoDanio: text })}
              style={{ marginBottom: 16 }}
            />

            <TextInput
              label="Reporte"
              value={formData.reporte}
              multiline
              onChangeText={(text) => setFormData({ ...formData, reporte: text })}
              style={{ marginBottom: 16 }}
            />

            <Text style={{ marginBottom: 8 }}>Estado:</Text>
            <Picker
              selectedValue={formData.estado}
              onValueChange={(val) => setFormData({ ...formData, estado: val })}
              style={{ backgroundColor: "#fff", marginBottom: 16 }}
            >
              <Picker.Item label="Pendiente" value="Pendiente" />
              <Picker.Item label="En proceso" value="En proceso" />
              <Picker.Item label="Resuelto" value="Resuelto" />
            </Picker>

            <Button mode="contained" onPress={handleSave} disabled={!formData.idImpresora || !formData.tipoDanio || !formData.reporte}>
              {editing ? "Actualizar" : "Guardar"}
            </Button>
          </Modal>

          <Modal visible={visibleMaquina} onDismiss={() => { setVisibleMaquina(false); setEditingMaquina(null); }} contentContainerStyle={styles.modal}>
            <Text variant="titleMedium" style={{ marginBottom: 16 }}>
              {editingMaquina ? "Editar Máquina" : "Nueva Máquina"}
            </Text>

            <TextInput
              label="Impresora"
              value={formMaquina.impresora}
              onChangeText={(text) => setFormMaquina({ ...formMaquina, impresora: text })}
              style={{ marginBottom: 16 }}
            />

            <TextInput
              label="Número de Serie"
              value={formMaquina.noSerie}
              onChangeText={(text) => setFormMaquina({ ...formMaquina, noSerie: text })}
              style={{ marginBottom: 16 }}
            />

            <TextInput
              label="Edificio"
              value={formMaquina.edificio}
              onChangeText={(text) => setFormMaquina({ ...formMaquina, edificio: text })}
              style={{ marginBottom: 16 }}
            />

            <TextInput
              label="Oficina"
              value={formMaquina.oficina}
              onChangeText={(text) => setFormMaquina({ ...formMaquina, oficina: text })}
              style={{ marginBottom: 16 }}
            />

            <Text style={{ marginBottom: 8 }}>Estado:</Text>
            <Picker
              selectedValue={formMaquina.estado}
              onValueChange={(val) => setFormMaquina({ ...formMaquina, estado: val })}
              style={{ backgroundColor: "#fff", marginBottom: 16 }}
            >
              <Picker.Item label="Operativa" value="Operativa" />
              <Picker.Item label="En reparación" value="En reparación" />
              <Picker.Item label="Fuera de servicio" value="Fuera de servicio" />
            </Picker>

            <Button mode="contained" onPress={handleSaveMaquina} disabled={!formMaquina.impresora || !formMaquina.noSerie || !formMaquina.edificio || !formMaquina.oficina}>
              {editingMaquina ? "Actualizar" : "Guardar"}
            </Button>
          </Modal>
        </Portal>
      </View>
    </Provider>
  );
};

export default AdministradorScreen;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 16,
    justifyContent: "center",
  },
  addButtons: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 16,
  },
});
