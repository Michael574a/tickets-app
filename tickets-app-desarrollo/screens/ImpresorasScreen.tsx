import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Alert } from "react-native";
import {
  Text,
  Button,
  Modal,
  Portal,
  TextInput,
  Appbar,
  Chip,
} from "react-native-paper";
import axios from "axios";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";
import { Config } from "../constants/config";

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

const ImpresorasScreen = () => {
  const [impresoras, setImpresoras] = useState<Maquina[]>([]);
  const [visible, setVisible] = useState(false);
  const [editingImpresora, setEditingImpresora] = useState<Maquina | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [impresoraData, setImpresoraData] = useState({
    impresora: "",
    noSerie: "",
    edificio: "",
    oficina: "",
    estado: "Operativa" as "Operativa" | "En reparación" | "Fuera de servicio",
    isActive: true,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  });

  useEffect(() => {
    fetchImpresoras();
  }, []);

  const fetchImpresoras = async () => {
    setRefreshing(true);
    try {
      const response = await axios.get<Maquina[]>(`${Config.API_URL}/maquinas`);
      setImpresoras(response.data);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las impresoras. Intenta de nuevo.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSave = async () => {
    try {
      const data: Maquina = {
        id: editingImpresora?.id || 0,
        impresora: impresoraData.impresora,
        noSerie: impresoraData.noSerie,
        edificio: impresoraData.edificio,
        oficina: impresoraData.oficina,
        estado: impresoraData.estado,
        isActive: impresoraData.isActive,
        createdAt: editingImpresora ? impresoraData.createdAt : new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      };

      if (editingImpresora) {
        await axios.put(`${Config.API_URL}/maquinas/${editingImpresora.id}`, data);
      } else {
        await axios.post(`${Config.API_URL}/maquinas`, data);
      }
      fetchImpresoras();
      setVisible(false);
      setEditingImpresora(null);
      setImpresoraData({
        impresora: "",
        noSerie: "",
        edificio: "",
        oficina: "",
        estado: "Operativa",
        isActive: true,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la impresora. Intenta de nuevo.");
    }
  };

  const handleEdit = (impresora: Maquina) => {
    setEditingImpresora(impresora);
    setImpresoraData({
      impresora: impresora.impresora,
      noSerie: impresora.noSerie,
      edificio: impresora.edificio,
      oficina: impresora.oficina,
      estado: impresora.estado,
      isActive: impresora.isActive,
      createdAt: impresora.createdAt,
      modifiedAt: impresora.modifiedAt,
    });
    setVisible(true);
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await axios.put(`${Config.API_URL}/maquinas/${id}`, {
        isActive: !currentStatus,
        modifiedAt: new Date().toISOString(),
      });
      fetchImpresoras();
    } catch (error) {
      Alert.alert("Error", "No se pudo cambiar el estado. Intenta de nuevo.");
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Gestión de Impresoras" />
        <Appbar.Action icon="refresh" onPress={fetchImpresoras} />
      </Appbar.Header>

      <View style={styles.content}>
        <FlatList
          data={impresoras}
          refreshing={refreshing}
          onRefresh={fetchImpresoras}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text variant="titleMedium">{item.impresora}</Text>
                <Chip
                  style={styles.statusChip}
                  icon={item.isActive ? "check-circle" : "alert-circle"}
                  textStyle={{ color: "black" }}
                  mode="outlined"
                >
                  {item.isActive ? "Activa" : "Inactiva"}
                </Chip>
              </View>

              <Text>
                <Icon name="office-building" size={16} /> {item.edificio} - {item.oficina}
              </Text>

              <Text>
                <Icon name="barcode" size={16} /> {item.noSerie}
              </Text>

              <Text>
                <Icon name="state-machine" size={16} /> Estado: {item.estado}
              </Text>
            </View>
          )}
        />

        <Portal>
          <Modal
            visible={visible}
            onDismiss={() => {
              setVisible(false);
              setEditingImpresora(null);
              setImpresoraData({
                impresora: "",
                noSerie: "",
                edificio: "",
                oficina: "",
                estado: "Operativa",
                isActive: true,
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString(),
              });
            }}
            contentContainerStyle={styles.modalContainer}
          >
            <Text variant="titleMedium" style={{ marginBottom: 20 }}>
              {editingImpresora ? "Editar Impresora" : "Nueva Impresora"}
            </Text>

            <TextInput
              label="Impresora"
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

            <Text style={{ marginBottom: 8 }}>Estado:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={impresoraData.estado}
                onValueChange={(value: "Operativa" | "En reparación" | "Fuera de servicio") =>
                  setImpresoraData({ ...impresoraData, estado: value })
                }
                style={styles.picker}
              >
                <Picker.Item label="Operativa" value="Operativa" />
                <Picker.Item label="En reparación" value="En reparación" />
                <Picker.Item label="Fuera de servicio" value="Fuera de servicio" />
              </Picker>
            </View>

            <Button
              mode="contained"
              onPress={handleSave}
              style={{ marginTop: 16 }}
              disabled={
                !impresoraData.impresora ||
                !impresoraData.noSerie ||
                !impresoraData.edificio ||
                !impresoraData.oficina
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
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