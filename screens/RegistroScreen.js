import axios from 'axios';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

const API_URL = "http://192.168.77.36:5000";

export default function RegistroScreen({ navigation }) {
  const [usuario, setUsuario] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [rol, setRol] = useState('tecnico'); // Por defecto, el rol será "usuario"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_URL}/register`, {
        usuario,
        contraseña,
        rol,
      });

      setSuccess('Usuario registrado exitosamente');
      setUsuario('');
      setContraseña('');
      setRol('usuario');
    } catch (err) {
      console.log('Error completo:', err);
      setError(err.response?.data?.error || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Registro de Usuario</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <TextInput
        label="Usuario"
        value={usuario}
        onChangeText={setUsuario}
        style={styles.input}
        autoCapitalize="none"
      />

      <TextInput
        label="Contraseña"
        value={contraseña}
        onChangeText={setContraseña}
        style={styles.input}
        secureTextEntry
      />

      <TextInput
        label="Rol"
        value={rol}
        onChangeText={setRol}
        style={styles.input}
        autoCapitalize="none"
      />

      <Button
        mode="contained"
        onPress={handleRegister}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Registrar
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate('LoginScreen')}
        style={styles.link}
      >
        Volver al inicio de sesión
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { marginBottom: 30, textAlign: 'center' },
  input: { marginBottom: 15 },
  button: { marginTop: 10 },
  link: { marginTop: 20, textAlign: 'center' },
  error: { color: 'red', marginBottom: 15, textAlign: 'center' },
  success: { color: 'green', marginBottom: 15, textAlign: 'center' },
});