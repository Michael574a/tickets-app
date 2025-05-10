import { Picker } from '@react-native-picker/picker';
import axios, { AxiosError } from 'axios';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import {
  Appbar,
  Button,
  Chip,
  Modal,
  Portal,
  Provider,
  Text,
  TextInput,
} from 'react-native-paper';
import { Config } from '../constants/config';

// Definir la interfaz para el error del backend
interface ErrorResponse {
  error?: string;
}

// Interfaces para Ticket y Maquina
interface Ticket {
  id: number;
  id_impresora: number;
  tipo_danio: string;
  reporte: string;
  estado: 'Pendiente' | 'En proceso' | 'Resuelto';
  is_active: boolean;
  created_at: string;
  modified_at: string;
}

interface Maquina {
  id: number;
  impresora: string;
  no_serie: string;
  edificio: string;
  oficina: string;
  estado: 'Operativa' | 'En reparación' | 'Fuera de servicio';
  is_active: boolean;
  created_at: string;
  modified_at: string;
}

const AdministradorScreen = () => {
  const [tab, setTab] = useState<'tickets' | 'maquinas'>('tickets');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [formData, setFormData] = useState({
    idImpresora: '',
    tipo_danio: '',
    reporte: '',
    estado: 'Pendiente' as 'Pendiente' | 'En proceso' | 'Resuelto',
    isActive: true,
  });
  const [visibleMaquina, setVisibleMaquina] = useState(false);
  const [editingMaquina, setEditingMaquina] = useState<Maquina | null>(null);
  const [formMaquina, setFormMaquina] = useState({
    impresora: '',
    no_serie: '',
    edificio: '',
    oficina: '',
    estado: 'Operativa' as 'Operativa' | 'En reparación' | 'Fuera de servicio',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  // Cargar tickets y máquinas
  const fetchAll = async () => {
    console.log('Recargando datos...');
    setLoading(true);
    try {
      const [tRes, mRes] = await Promise.all([
        axios.get<Ticket[]>(`${Config.API_URL}/tickets`),
        axios.get<Maquina[]>(`${Config.API_URL}/maquinas`),
      ]);
      setTickets(tRes.data);
      setMaquinas(mRes.data);
      console.log('Datos recargados - Tickets:', tRes.data);
      console.log('Datos recargados - Máquinas:', mRes.data);
    } catch (e) {
      const error = e as AxiosError<ErrorResponse>;
      Alert.alert('Error', 'No se pudieron cargar los datos. Intenta de nuevo.');
      console.error('Error al cargar datos:', error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Guardar o actualizar un ticket
  const handleSave = async () => {
    setLoading(true);
    try {
      const idImpresoraNumber = parseInt(formData.idImpresora);
      if (isNaN(idImpresoraNumber)) {
        Alert.alert('Error', 'Por favor selecciona una impresora válida.');
        setLoading(false);
        return;
      }
      if (!formData.tipo_danio.trim() || !formData.reporte.trim()) {
        Alert.alert('Error', 'Completa todos los campos requeridos (Tipo de Daño y Reporte).');
        setLoading(false);
        return;
      }

      const dataToSend = {
        id_impresora: idImpresoraNumber,
        tipo_danio: formData.tipo_danio.trim(),
        reporte: formData.reporte.trim(),
        estado: formData.estado,
        is_active: formData.isActive,
      };

      let response;
      if (editing) {
        console.log('Enviando PUT a:', `${Config.API_URL}/tickets/${editing.id}`, 'con datos:', dataToSend);
        response = await axios.put(`${Config.API_URL}/tickets/${editing.id}`, dataToSend);
      } else {
        console.log('Enviando POST a:', `${Config.API_URL}/tickets`, 'con datos:', dataToSend);
        response = await axios.post(`${Config.API_URL}/tickets`, dataToSend);
      }
      console.log('Respuesta del backend:', response.data);

      setVisible(false);
      setEditing(null);
      setFormData({
        idImpresora: '',
        tipo_danio: '',
        reporte: '',
        estado: 'Pendiente',
        isActive: true,
      });
      await fetchAll();
    } catch (e) {
      const error = e as AxiosError<ErrorResponse>;
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      Alert.alert('Error', `No se pudo ${editing ? 'actualizar' : 'guardar'} el ticket. Detalle: ${errorMessage}`);
      console.error(`Error al ${editing ? 'actualizar' : 'guardar'} ticket:`, error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  // Guardar o actualizar una máquina
  const handleSaveMaquina = async () => {
    setLoading(true);
    try {
      if (
        !formMaquina.impresora.trim() ||
        !formMaquina.no_serie.trim() ||
        !formMaquina.edificio.trim() ||
        !formMaquina.oficina.trim()
      ) {
        Alert.alert('Error', 'Completa todos los campos requeridos.');
        setLoading(false);
        return;
      }

      const dataToSend = {
        impresora: formMaquina.impresora.trim(),
        no_serie: formMaquina.no_serie.trim(),
        edificio: formMaquina.edificio.trim(),
        oficina: formMaquina.oficina.trim(),
        estado: formMaquina.estado,
        is_active: formMaquina.is_active,
      };

      let response;
      if (editingMaquina) {
        console.log('Enviando PUT a:', `${Config.API_URL}/maquinas/${editingMaquina.id}`, 'con datos:', dataToSend);
        response = await axios.put(`${Config.API_URL}/maquinas/${editingMaquina.id}`, dataToSend);
      } else {
        console.log('Enviando POST a:', `${Config.API_URL}/maquinas`, 'con datos:', dataToSend);
        response = await axios.post(`${Config.API_URL}/maquinas`, dataToSend);
      }
      console.log('Respuesta del backend:', response.data);

      setVisibleMaquina(false);
      setEditingMaquina(null);
      setFormMaquina({
        impresora: '',
        no_serie: '',
        edificio: '',
        oficina: '',
        estado: 'Operativa',
        is_active: true,
      });
      await fetchAll();
    } catch (e) {
      const error = e as AxiosError<ErrorResponse>;
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      Alert.alert('Error', `No se pudo ${editingMaquina ? 'actualizar' : 'guardar'} la máquina. Detalle: ${errorMessage}`);
      console.error(`Error al ${editingMaquina ? 'actualizar' : 'guardar'} máquina:`, error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  // Editar un ticket
  const handleEdit = (item: Ticket) => {
    console.log('Editando ticket:', item);
    setEditing(item);
    setFormData({
      idImpresora: item.id_impresora.toString(),
      tipo_danio: item.tipo_danio || '',
      reporte: item.reporte || '',
      estado: item.estado,
      isActive: item.is_active ?? true,
    });
    setVisible(true);
  };

  // Editar una máquina
  const handleEditMaquina = (item: Maquina) => {
    console.log('Editando máquina:', item);
    setEditingMaquina(item);
    setFormMaquina({
      impresora: item.impresora || '',
      no_serie: item.no_serie || '',
      edificio: item.edificio || '',
      oficina: item.oficina || '',
      estado: item.estado,
      is_active: item.is_active ?? true,
    });
    setVisibleMaquina(true);
  };

  // Eliminar un ticket (FUNCIÓN CORREGIDA)
  const handleDelete = async (id: number) => {
  console.log('Intentando eliminar ticket con id:', id);
  Alert.alert('Eliminar', '¿Deseas eliminar este registro?', [
    { text: 'Cancelar', onPress: () => console.log('Eliminación cancelada') },
    {
      text: 'Eliminar',
      style: 'destructive',
      onPress: async () => {
        setLoading(true);
        try {
          const deleteUrl = `${Config.API_URL}/tickets/${id}`;
          console.log('Enviando DELETE a:', deleteUrl);
          const response = await axios.delete(deleteUrl);
          console.log('Respuesta del backend (DELETE ticket):', response.data);

          // Actualizar la lista de tickets inmediatamente
          setTickets((prevTickets) => prevTickets.filter((ticket) => ticket.id !== id));
          Alert.alert('Éxito', 'Ticket eliminado correctamente');
        } catch (e) {
          const error = e as AxiosError<ErrorResponse>;
          const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
          console.error('Error al eliminar ticket:', error.response?.data || error);
          Alert.alert('Error', `No se pudo eliminar el ticket. Detalle: ${errorMessage}`);
        } finally {
          setLoading(false);
        }
      },
    },
  ]);
};
  // Eliminar una máquina
  const handleDeleteMaquina = async (id: number) => {
  console.log('Intentando eliminar máquina con id:', id);
  Alert.alert('Eliminar', '¿Deseas eliminar esta máquina?', [
    { text: 'Cancelar', onPress: () => console.log('Eliminación cancelada') },
    {
      text: 'Eliminar',
      style: 'destructive',
      onPress: async () => {
        setLoading(true);
        try {
          const deleteUrl = `${Config.API_URL}/maquinas/${id}`;
          console.log('Enviando DELETE a:', deleteUrl);
          const response = await axios.delete(deleteUrl);
          console.log('Respuesta del backend (DELETE máquina):', response.data);

          // Actualizar la lista de máquinas inmediatamente
          setMaquinas((prevMaquinas) => prevMaquinas.filter((maquina) => maquina.id !== id));
          Alert.alert('Éxito', 'Máquina eliminada correctamente');
        } catch (e) {
          const error = e as AxiosError<ErrorResponse>;
          const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
          console.error('Error al eliminar máquina:', error.response?.data || error);
          Alert.alert('Error', `No se pudo eliminar la máquina. Detalle: ${errorMessage}`);
        } finally {
          setLoading(false);
        }
      },
    },
  ]);
};
  // Formatear fechas con manejo de errores
  const formatDate = (date: string) => {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return 'Fecha inválida';
    }
    return parsedDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <Provider>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="CRUD Tickets y Máquinas" />
        </Appbar.Header>

        <View style={styles.tabs}>
          <Button mode={tab === 'tickets' ? 'contained' : 'outlined'} onPress={() => setTab('tickets')}>
            Tickets
          </Button>
          <Button
            mode={tab === 'maquinas' ? 'contained' : 'outlined'}
            onPress={() => setTab('maquinas')}
            style={{ marginLeft: 8 }}
          >
            Máquinas
          </Button>
        </View>

        <View style={styles.addButtons}>
          {tab === 'tickets' && (
            <Button
              mode="contained"
              onPress={() => setVisible(true)}
              style={{ marginRight: 8 }}
              disabled={loading}
            >
              Nuevo Ticket
            </Button>
          )}
          {tab === 'maquinas' && (
            <Button mode="contained" onPress={() => setVisibleMaquina(true)} disabled={loading}>
              Nueva Máquina
            </Button>
          )}
        </View>

        {tab === 'tickets' && (
          <FlatList
            data={tickets}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.row}>
                  <Text variant="titleMedium">
                    {maquinas.find((m) => m.id === item.id_impresora)?.impresora || 'Desconocida'}
                  </Text>
                  <Text>{formatDate(item.created_at)}</Text>
                </View>
                <Chip style={{ marginBottom: 8 }}>{item.tipo_danio}</Chip>
                <Text>{item.reporte}</Text>
                <Text style={{ marginTop: 6 }}>
                  Estado: <Text style={{ fontWeight: 'bold' }}>{item.estado}</Text>
                </Text>
                <View style={[styles.row, { marginTop: 10 }]}>
                  <Button icon="pencil" mode="outlined" onPress={() => handleEdit(item)}>
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
          />
        )}

        {tab === 'maquinas' && (
          <FlatList
            data={maquinas}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text variant="titleMedium">{item.impresora}</Text>
                <Text>Serie: {item.no_serie || 'No especificado'}</Text>
                <Text>
                  {item.edificio} - {item.oficina}
                </Text>
                <Text>Estado: {item.estado}</Text>
                <View style={[styles.row, { marginTop: 10 }]}>
                  <Button icon="pencil" mode="outlined" onPress={() => handleEditMaquina(item)}>
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
          />
        )}

        <Portal>
          <Modal
            visible={visible}
            onDismiss={() => {
              setVisible(false);
              setEditing(null);
            }}
            contentContainerStyle={styles.modal}
          >
            <Text variant="titleMedium" style={{ marginBottom: 16 }}>
              {editing ? 'Editar Ticket' : 'Nuevo Ticket'}
            </Text>
            <Text style={{ marginBottom: 8 }}>Impresora:</Text>
            <Picker
              selectedValue={formData.idImpresora}
              onValueChange={(val) => setFormData({ ...formData, idImpresora: val })}
              style={{ backgroundColor: '#fff', marginBottom: 16 }}
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
              onValueChange={(val: 'Pendiente' | 'En proceso' | 'Resuelto') =>
                setFormData({ ...formData, estado: val })
              }
              style={{ backgroundColor: '#fff', marginBottom: 16 }}
            >
              <Picker.Item label="Pendiente" value="Pendiente" />
              <Picker.Item label="En proceso" value="En proceso" />
              <Picker.Item label="Resuelto" value="Resuelto" />
            </Picker>
            <Button
              mode="contained"
              onPress={handleSave}
              disabled={!formData.idImpresora || !formData.tipo_danio.trim() || !formData.reporte.trim() || loading}
            >
              {editing ? 'Actualizar' : 'Guardar'}
            </Button>
          </Modal>

          <Modal
            visible={visibleMaquina}
            onDismiss={() => {
              setVisibleMaquina(false);
              setEditingMaquina(null);
            }}
            contentContainerStyle={styles.modal}
          >
            <Text variant="titleMedium" style={{ marginBottom: 16 }}>
              {editingMaquina ? 'Editar Máquina' : 'Nueva Máquina'}
            </Text>
            <TextInput
              label="Impresora"
              value={formMaquina.impresora}
              onChangeText={(text) => setFormMaquina({ ...formMaquina, impresora: text })}
              style={{ marginBottom: 16 }}
            />
            <TextInput
              label="Número de Serie"
              value={formMaquina.no_serie}
              onChangeText={(text) => setFormMaquina({ ...formMaquina, no_serie: text })}
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
              onValueChange={(val: 'Operativa' | 'En reparación' | 'Fuera de servicio') =>
                setFormMaquina({ ...formMaquina, estado: val })
              }
              style={{ backgroundColor: '#fff', marginBottom: 16 }}
            >
              <Picker.Item label="Operativa" value="Operativa" />
              <Picker.Item label="En reparación" value="En reparación" />
              <Picker.Item label="Fuera de servicio" value="Fuera de servicio" />
            </Picker>
            <Button
              mode="contained"
              onPress={handleSaveMaquina}
              disabled={
                !formMaquina.impresora.trim() ||
                !formMaquina.no_serie.trim() ||
                !formMaquina.edificio.trim() ||
                !formMaquina.oficina.trim() ||
                loading
              }
            >
              {editingMaquina ? 'Actualizar' : 'Guardar'}
            </Button>
          </Modal>
        </Portal>

        {loading && (
          <View style={styles.loadingContainer}>
            <Text>Cargando...</Text>
          </View>
        )}
      </View>
    </Provider>
  );
};

export default AdministradorScreen;

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'center',
  },
  addButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
});