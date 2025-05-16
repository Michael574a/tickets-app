import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import axiosRetry from "axios-retry";
import { useEffect, useState } from "react";
import { FlatList, Platform, StyleSheet, View } from "react-native";
import {
  Appbar,
  Button,
  Chip,
  FAB,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Configura reintentos para axios
axiosRetry(axios, { retries: 3, retryDelay: (retryCount) => retryCount * 1000 });

// Configura API_URL según el entorno
const API_URL =
  Platform.OS === "android" && !Platform.isPad
    ? "http://10.0.2.2:5000" // Emulador Android
    : "http://192.168.1.107:5000"; // Dispositivo físico o IP de tu máquina

const ImpresorasScreen = () => {
  const theme = useTheme();
  const [impresoras, setImpresoras] = useState([]);
  const [visible, setVisible] = useState(false);
  const [editingImpresora, setEditingImpresora] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [impresoraData, setImpresoraData] = useState({
    edificio: "",
    oficina: "",
    impresora: "",
    no_serie: "",
    estado: "Operativa",
    is_active: true,
  });

  useEffect(() => {
    fetchImpresoras();
  }, []);

  const fetchImpresoras = async () => {
    try {
      setRefreshing(true);
      setErrorMessage("");
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        setErrorMessage("No se encontró token de autenticación");
        return;
      }
      console.log("Solicitando impresoras a:", `${API_URL}/maquinas`, "con token:", token);
      const response = await axios.get(`${API_URL}/maquinas`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000, // 15 segundos de timeout
      });
      setImpresoras(response.data);
    } catch (error) {
      console.error("Error al obtener impresoras:", error.message);
      setErrorMessage("Error al cargar las impresoras. Intenta de nuevo.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSave = async () => {
    try {
      setErrorMessage("");
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        setErrorMessage("No se encontró token de autenticación");
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      const dataToSend = {
        ...impresoraData,
        created_at: editingImpresora ? undefined : new Date().toISOString(),
        modified_at: new Date().toISOString(),
      };

      if (editingImpresora) {
        await axios.put(`${API_URL}/maquinas/${editingImpresora.id}`, dataToSend, { headers });
      } else {
        await axios.post(`${API_URL}/maquinas`, dataToSend, { headers });
      }
      fetchImpresoras();
      setVisible(false);
      setEditingImpresora(null);
      resetForm();
    } catch (error) {
      console.error("Error al guardar impresora:", error.message);
      setErrorMessage("Error al guardar la impresora. Intenta de nuevo.");
    }
  };

  const handleEdit = (impresora) => {
    setEditingImpresora(impresora);
    setImpresoraData({
      edificio: impresora.edificio,
      oficina: impresora.oficina,
      impresora: impresora.impresora,
      no_serie: impresora.no_serie,
      estado: impresora.estado,
      is_active: impresora.is_active,
    });
    setVisible(true);
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      setErrorMessage("");
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        setErrorMessage("No se encontró token de autenticación");
        return;
      }
      await axios.put(
        `${API_URL}/maquinas/${id}`,
        {
          is_active: !currentStatus,
          modified_at: new Date().toISOString(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchImpresoras();
    } catch (error) {
      console.error("Error al cambiar estado:", error.message);
      setErrorMessage("Error al cambiar el estado. Intenta de nuevo.");
    }
  };

  const resetForm = () => {
    setImpresoraData({
      edificio: "",
      oficina: "",
      impresora: "",
      no_serie: "",
      estado: "Operativa",
      is_active: true,
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    card: {
      padding: 16,
      marginBottom: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      elevation: 2,
      boxShadow: "0 0 8px rgba(147, 147, 147, 0.15)",
      border: `1px solid rgba(71, 71, 71, 0.33)`,
    },
    modalContainer: {
      padding: 20,
      backgroundColor: theme.colors.surface,
      margin: 20,
      borderRadius: 8,
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 4,
      marginBottom: 16,
      overflow: "hidden",
    },
    picker: {
      color: theme.colors.onSurface,
      backgroundColor: theme.colors.surface,
    },
    fab: {
      position: "absolute",
      margin: 16,
      right: 0,
      bottom: 80,
      backgroundColor: theme.colors.primary,
    },
    statusChip: {
      alignSelf: "flex-start",
      marginVertical: 8,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    errorText: {
      color: "red",
      textAlign: "center",
      marginBottom: 10,
    },
  });

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Gestión de Impresoras" />
        <Appbar.Action icon="refresh" onPress={fetchImpresoras} />
      </Appbar.Header>

      <View style={styles.content}>
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <FlatList
          data={impresoras}
          refreshing={refreshing}
          onRefresh={fetchImpresoras}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                  {item.impresora}
                </Text>
                <Chip
                  style={styles.statusChip}
                  icon={item.is_active ? "check-circle" : "alert-circle"}
                  textStyle={{ color: "black" }}
                  mode="outlined"
                  onPress={() => toggleStatus(item.id, item.is_active)}
                >
                  {item.is_active ? "Activa" : "Inactiva"}
                </Chip>
              </View>

              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                <Icon name="office-building" size={16} /> {item.edificio} - {item.oficina}
              </Text>

              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                <Icon name="barcode" size={16} /> {item.no_serie}
              </Text>

              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                <Icon name="state-machine" size={16} /> Estado: {item.estado}
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
          ListEmptyComponent={<Text>No hay impresoras disponibles.</Text>}
        />

        <Portal>
          <Modal
            visible={visible}
            onDismiss={() => {
              setVisible(false);
              setEditingImpresora(null);
              resetForm();
            }}
            contentContainerStyle={styles.modalContainer}
          >
            <Text
              variant="titleMedium"
              style={{ marginBottom: 20, color: theme.colors.primary }}
            >
              {editingImpresora ? "Editar Impresora" : "Nueva Impresora"}
            </Text>

            <TextInput
              label="Edificio"
              value={impresoraData.edificio}
              onChangeText={(text) => setImpresoraData({ ...impresoraData, edificio: text })}
              style={{ marginBottom: 16 }}
              left={<TextInput.Icon icon="office-building" />}
            />

            <TextInput
              label="Oficina"
              value={impresoraData.oficina}
              onChangeText={(text) => setImpresoraData({ ...impresoraData, oficina: text })}
              style={{ marginBottom: 16 }}
              left={<TextInput.Icon icon="door" />}
            />

            <TextInput
              label="Nombre Impresora"
              value={impresoraData.impresora}
              onChangeText={(text) => setImpresoraData({ ...impresoraData, impresora: text })}
              style={{ marginBottom: 16 }}
              left={<TextInput.Icon icon="printer" />}
            />

            <TextInput
              label="Número de Serie"
              value={impresoraData.no_serie}
              onChangeText={(text) => setImpresoraData({ ...impresoraData, no_serie: text })}
              style={{ marginBottom: 16 }}
              left={<TextInput.Icon icon="barcode" />}
            />

            <Text style={{ marginBottom: 8, color: theme.colors.onSurface }}>
              Estado:
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={impresoraData.estado}
                onValueChange={(value) => setImpresoraData({ ...impresoraData, estado: value })}
                style={styles.picker}
              >
                <Picker.Item label="Operativa" value="Operativa" />
                <Picker.Item label="En Mantenimiento" value="En Mantenimiento" />
                <Picker.Item label="Fuera de Servicio" value="Fuera de Servicio" />
              </Picker>
            </View>

            <Button
              mode="contained"
              onPress={handleSave}
              style={{ marginTop: 16 }}
              disabled={
                !impresoraData.edificio ||
                !impresoraData.oficina ||
                !impresoraData.impresora ||
                !impresoraData.no_serie
              }
            >
              {editingImpresora ? "Actualizar" : "Guardar"}
            </Button>
          </Modal>
        </Portal>

        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => {
            setEditingImpresora(null);
            resetForm();
            setVisible(true);
          }}
        />
      </View>
    </View>
  );
};

export default ImpresorasScreen;