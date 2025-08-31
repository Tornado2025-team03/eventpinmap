import { Tabs } from "expo-router";
import BottomNav from "../../components/ui/BottomNavigation";

export default function TabLayout() {
  return (
    <Tabs
      //screenOptions={{ headerShown: false }} // ヘッダーの有無を個別に設定するため削除
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tabs.Screen name="see" options={{ title: "見る", headerShown: false }} />
      <Tabs.Screen
        name="connect"
        options={{ title: "繋がる", headerShown: false }}
      />
      <Tabs.Screen
        name="plan"
        options={{ title: "企画", headerShown: false }}
      />
      <Tabs.Screen
        name="bookings"
        options={{ title: "予約一覧", headerShown: false }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "設定", headerShown: true }}
      />
    </Tabs>
  );
}
