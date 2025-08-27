import { Redirect } from "expo-router";

export default function Index() {
  // Always redirect to auth screen on app start
  return <Redirect href="/auth" />;
}
