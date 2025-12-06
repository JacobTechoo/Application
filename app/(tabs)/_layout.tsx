import { useEffect, useState } from 'react';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../supabaseClient';
import { DrawerToggleButton } from '@react-navigation/drawer';
import { ActivityIndicator, View } from 'react-native';

export default function DrawerLayout() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // 🔒 If not logged in, don't stay in (tabs)
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace('/sign_in'); // underscore to match app/sign_in.tsx
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        // 👇 force hamburger/menu icon on the left
        headerLeft: () => <DrawerToggleButton />,
      }}
    >
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: 'Profile',
          title: 'Your Profile',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Home',
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="book-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="logout"
        options={{
          drawerLabel: 'Log out',
          title: 'Log out',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="log-out-outline" color={color} size={size} />
          ),
        }}
      />
    </Drawer>
  );
}
