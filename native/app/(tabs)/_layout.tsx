import { Tabs } from "expo-router";
import BottomNav from "../../components/ui/BottomNavigation";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tabs.Screen name="see" options={{ title: "見る" }} />
      <Tabs.Screen name="connect" options={{ title: "繋がる" }} />
      <Tabs.Screen name="plan" options={{ title: "企画" }} />
      <Tabs.Screen name="bookings" options={{ title: "予約一覧" }} />
      <Tabs.Screen name="settings" options={{ title: "設定" }} />
    </Tabs>
  );
}
