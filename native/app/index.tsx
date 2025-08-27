import { Redirect } from "expo-router";
import { useAuth } from "@/provider/AuthProvider";

export default function Index() {
  const { session } = useAuth();
  if (!session || !session.user) {
    return <Redirect href="/auth" />;
  }
  return <Redirect href="/(tabs)/see" />; // or just "/(tabs)" if you want the default tab
}
