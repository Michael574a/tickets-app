import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

const API_URL = Platform.OS === 'web' ? "http://localhost:5000" : "http://10.0.2.2:5000"; // Ajusta la IP

export default function LoginScreen({ navigation }) {
  const [usuario, setUsuario] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/login`, {
        usuario,
        contraseña,
      });

      const { token } = response.data;
      await AsyncStorage.setItem('userToken', token);
      console.log('Token guardado exitosamente:', token);

      if (response.data.usuario.rol === 'administrador') {
        navigation.navigate('AdministradorScreen');
      } else {
        navigation.navigate('UsuarioScreen');
      }
    } catch (err) {
      console.log('Error completo:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.error || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Inicio de Sesión</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

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

      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Ingresar
      </Button>
      <Button
        mode="text"
        onPress={() => navigation.navigate('RegistroScreen')}
        style={styles.link}
      >
        ¿No tienes una cuenta? Regístrate
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { marginBottom: 30, textAlign: 'center' },
  input: { marginBottom: 15 },
  button: { marginTop: 10 },
  error: { color: 'red', marginBottom: 15, textAlign: 'center' },
  link: { marginTop: 10, textAlign: 'center' },
});