import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MD3LightTheme, Provider as PaperProvider } from "react-native-paper";
import AdministradorScreen from './screens/AdministradorScreen';

import LoginScreen from './screens/LoginScreen';

import UsuarioScreen from './screens/UsuarioScreen';
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PaperProvider theme={MD3LightTheme}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="LoginScreen">
        
          <Stack.Screen name="UsuarioScreen" component={UsuarioScreen}options={{
    title: 'Panel de Usuario', 
    headerBackVisible: false, 
   
  }} />
          <Stack.Screen name="AdministradorScreen" component={AdministradorScreen} options={{
    title: 'Panel de Administración', 
    headerBackVisible: false,  
    
  }}/>
          <Stack.Screen
  name="LoginScreen"
  component={LoginScreen}
  options={{
    title: 'Aplicación de Tickets', 
    headerBackVisible: false,  
    
  }}
/>
          
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
