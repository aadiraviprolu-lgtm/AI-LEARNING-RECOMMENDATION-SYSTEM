import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth';
import { Loading, OfflineBanner } from './src/components';
import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import TasksScreen from './src/screens/TasksScreen';
import TaskFormScreen from './src/screens/TaskFormScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function LogoutButton() {
  const { logout } = useAuth();
  return <Pressable onPress={logout} hitSlop={10}><Text style={{ color: colors.primary, fontWeight: '700' }}>Log out</Text></Pressable>;
}

function MainTabs() {
  return (
    <Tabs.Navigator screenOptions={{ headerRight: () => <View style={{ marginRight: 14 }}><LogoutButton /></View>, tabBarActiveTintColor: colors.primary }}>
      <Tabs.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: () => <Text>📊</Text> }} />
      <Tabs.Screen name="Projects" component={ProjectsScreen} options={{ tabBarIcon: () => <Text>📁</Text> }} />
      <Tabs.Screen name="Tasks" component={TasksScreen} options={{ tabBarIcon: () => <Text>✅</Text> }} />
    </Tabs.Navigator>
  );
}

const Login = ({ navigation }) => <AuthScreen mode="login" navigation={navigation} />;
const Register = ({ navigation }) => <AuthScreen mode="register" navigation={navigation} />;

function Root() {
  const { user, booting } = useAuth();
  if (booting) return <Loading />;
  return (
    <Stack.Navigator>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="ProjectTasks" component={TasksScreen} options={({ route }) => ({ title: route.params.name })} />
          <Stack.Screen name="TaskForm" component={TaskFormScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <OfflineBanner />
        <NavigationContainer><Root /></NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
