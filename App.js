import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import AdministradorScreen from './screens/AdministradorScreen';
import Inicio from './screens/Inicio';
import LoginScreen from './screens/LoginScreen';
import RegistroScreen from './screens/RegistroScreen';
import UsuarioScreen from './screens/UsuarioScreen';
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="LoginScreen">
          <Stack.Screen name="Inicio" component={Inicio} />
          <Stack.Screen name="UsuarioScreen" component={UsuarioScreen} />
          <Stack.Screen name="AdministradorScreen" component={AdministradorScreen} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="RegistroScreen" component={RegistroScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
