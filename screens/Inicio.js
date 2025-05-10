import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

export default function Inicio({ navigation }) {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Pantalla de Inicio</Text>
      <Button mode="contained" onPress={() => navigation.navigate('UsuarioScreen')} style={styles.button}>
        Ir a Pagina de Técnico
      </Button>
      <Button mode="outlined" onPress={() => navigation.navigate('AdministradorScreen')} style={styles.button}>
        Ir a Pagina de Administrador
      </Button>
      <Button mode="outlined" onPress={() => navigation.navigate('LoginScreen')} style={styles.button}>
        Ir a Login
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  button: { marginVertical: 10 }
});
