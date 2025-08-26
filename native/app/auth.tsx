import React, { useState } from 'react';
import { Alert, StyleSheet, View, TextInput, Button } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <TextInput aria-label="Email" onChangeText={setEmail} value={email} placeholder="email@address.com" autoCapitalize="none" />
      <TextInput aria-label="Password" onChangeText={setPassword} value={password} secureTextEntry={true} placeholder="Password" autoCapitalize="none" />
      <Button title="Sign in" disabled={loading} onPress={signInWithEmail} />
      <Button title="Sign up" disabled={loading} onPress={signUpWithEmail} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
});