// App.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login  from './screens/Login';
import Signup from './screens/Signup';
import Home   from './screens/Home';
import ReportSubmission from './screens/ReportSubmission';

const Stack = createStackNavigator();




export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown:false }}>
          <Stack.Screen name="Login"  component={Login}/>
          <Stack.Screen name="Signup" component={Signup}/>
          <Stack.Screen name="Home"   component={Home}/>
          <Stack.Screen name="ReportSubmission" component={ReportSubmission}/>
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }
});
