import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";


// Ajusta esta URL según tu IP local si estás en un dispositivo físico
const API_URL = Platform.OS === "web" ? "http://localhost:5000" : "http://192.168.101.8:5000"; // Cambia 192.168.1.10 por tu IP

export default function LoginScreen({ navigation }) {
  const theme = useTheme(); // Obtiene el tema actual
  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      console.log("Intentando iniciar sesión con:", { usuario, contraseña });
      const response = await axios.post(`${API_URL}/login`, {
        usuario,
        contraseña,
      });

      console.log("Respuesta del servidor:", response.data);

      const { token, usuario: userData } = response.data;
      if (!token || !userData || !userData.rol) {
        throw new Error("Respuesta del servidor incompleta: falta token o rol");
      }

      await AsyncStorage.setItem("userToken", token);
      console.log("Token guardado exitosamente:", token);

      const { rol } = userData;
      if (rol === "administrador") {
        console.log("Navegando a AdministradorScreen");
        navigation.navigate("AdministradorScreen");
      } else {
        console.log("Navegando a UsuarioScreen");
        navigation.navigate("UsuarioScreen");
      }
    } catch (err) {
      console.error("Error completo:", err.response ? err.response.data : err.message);
      const errorMessage = err.response?.data?.error || "Error al iniciar sesión. Verifique su conexión o credenciales.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={styles.title}>
        Inicio de Sesión
      </Text>

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
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { marginBottom: 30, textAlign: "center" },
  input: { marginBottom: 15 },
  button: { marginTop: 10 },
  error: { color: "red", marginBottom: 15, textAlign: "center" },
  link: { marginTop: 10, textAlign: "center" },
});