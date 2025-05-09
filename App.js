import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import AdministradorScreen from './screens/AdministradorScreen';
import Inicio from './screens/Inicio';
import UsuarioScreen from './screens/UsuarioScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Inicio">
          <Stack.Screen name="Inicio" component={Inicio} />
          <Stack.Screen name="UsuarioScreen" component={UsuarioScreen} />
          <Stack.Screen name="AdministradorScreen" component={AdministradorScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
