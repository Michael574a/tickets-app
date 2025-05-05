import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import {
  Text,
  Button,
  Modal,
  Portal,
  TextInput,
  Appbar,
  useTheme,
  Chip,
} from "react-native-paper";
import axios from "axios";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";

const API_URL = "http://45.70.15.5:5000";

const ImpresorasScreen = () => {
  const theme = useTheme();
  const [impresoras, setImpresoras] = useState([]);
  const [visible, setVisible] = useState(false);
  const [editingImpresora, setEditingImpresora] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [impresoraData, setImpresoraData] = useState({
    edificio: "",
    oficina: "",
    impresora: "",
    noSerie: "",
    estado: "Operativa",
    isActive: true,
  });

  useEffect(() => {
    fetchImpresoras();
  }, []);

  const fetchImpresoras = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get(`${API_URL}/maquinas`);
      setImpresoras(response.data);
    } catch (error) {
      console.error("Error al obtener impresoras:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingImpresora) {
        await axios.put(`${API_URL}/maquinas/${editingImpresora._id}`, {
          ...impresoraData,
          modifiedAt: new Date().toISOString(),
        });
      } else {
        await axios.post(`${API_URL}/maquinas`, {
          ...impresoraData,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        });
      }
      fetchImpresoras();
      setVisible(false);
      setEditingImpresora(null);
      resetForm();
    } catch (error) {
      console.error("Error al guardar impresora:", error);
    }
  };

  const handleEdit = (impresora) => {
    setEditingImpresora(impresora);
    setImpresoraData({
      edificio: impresora.edificio,
      oficina: impresora.oficina,
      impresora: impresora.impresora,
      noSerie: impresora.noSerie,
      estado: impresora.estado,
      isActive: impresora.isActive,
    });
    setVisible(true);
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await axios.put(`${API_URL}/maquinas/${id}`, {
        isActive: !currentStatus,
        modifiedAt: new Date().toISOString(),
      });
      fetchImpresoras();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  const resetForm = () => {
    setImpresoraData({
      edificio: "",
      oficina: "",
      impresora: "",
      noSerie: "",
      estado: "Operativa",
      isActive: true,
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
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <Appbar.Header>
        <Appbar.Content title="Gestión de Impresoras" />
        <Appbar.Action icon="refresh" onPress={fetchImpresoras} />
      </Appbar.Header>

      {/* Contenido Principal */}
      <View style={styles.content}>
        <FlatList
          data={impresoras}
          refreshing={refreshing}
          onRefresh={fetchImpresoras}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text
                  variant="titleMedium"
                  style={{ color: theme.colors.primary }}
                >
                  {item.impresora}
                </Text>
                <Chip
                  style={styles.statusChip}
                  icon={item.isActive ? "check-circle" : "alert-circle"}
                  textStyle={{ color: "black" }}
                  mode="outlined"
                >
                  {item.isActive ? "Activa" : "Inactiva"}
                </Chip>
              </View>

              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                <Icon name="office-building" size={16} /> {item.edificio} -{" "}
                {item.oficina}
              </Text>

              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                <Icon name="barcode" size={16} /> {item.noSerie}
              </Text>

              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                <Icon name="state-machine" size={16} /> Estado: {item.estado}
              </Text>
            </View>
          )}
        />

        {/* MODAL */}
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
              onChangeText={(text) =>
                setImpresoraData({ ...impresoraData, edificio: text })
              }
              style={{ marginBottom: 16 }}
              left={<TextInput.Icon icon="office-building" />}
            />

            <TextInput
              label="Oficina"
              value={impresoraData.oficina}
              onChangeText={(text) =>
                setImpresoraData({ ...impresoraData, oficina: text })
              }
              style={{ marginBottom: 16 }}
              left={<TextInput.Icon icon="door" />}
            />

            <TextInput
              label="Nombre Impresora"
              value={impresoraData.impresora}
              onChangeText={(text) =>
                setImpresoraData({ ...impresoraData, impresora: text })
              }
              style={{ marginBottom: 16 }}
              left={<TextInput.Icon icon="printer" />}
            />

            <TextInput
              label="Número de Serie"
              value={impresoraData.noSerie}
              onChangeText={(text) =>
                setImpresoraData({ ...impresoraData, noSerie: text })
              }
              style={{ marginBottom: 16 }}
              left={<TextInput.Icon icon="barcode" />}
            />

            <Text style={{ marginBottom: 8, color: theme.colors.onSurface }}>
              Estado:
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={impresoraData.estado}
                onValueChange={(value) =>
                  setImpresoraData({ ...impresoraData, estado: value })
                }
                style={styles.picker}
              >
                <Picker.Item label="Operativa" value="Operativa" />
                <Picker.Item
                  label="En Mantenimiento"
                  value="En Mantenimiento"
                />
                <Picker.Item
                  label="Fuera de Servicio"
                  value="Fuera de Servicio"
                />
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
                !impresoraData.noSerie
              }
            >
              {editingImpresora ? "Actualizar" : "Guardar"}
            </Button>
          </Modal>
        </Portal>
      </View>
    </View>
  );
};

export default ImpresorasScreen;
