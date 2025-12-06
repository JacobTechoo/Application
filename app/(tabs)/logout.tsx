import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../../supabaseClient';
import { useRouter } from 'expo-router';

export default function LogoutScreen() {
  const router = useRouter();

  useEffect(() => {
    const doLogout = async () => {
      await supabase.auth.signOut();
      router.replace('/sign_in');
    };
    doLogout();
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Logging out...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 18 },
});
