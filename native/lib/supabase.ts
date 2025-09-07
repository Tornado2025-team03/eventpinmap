import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ejccfisshgflntmhvimv.supabase.co"; //TODO: 後ほどprocess.envに置き換える
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqY2NmaXNzaGdmbG50bWh2aW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDY1MzUsImV4cCI6MjA3MTc4MjUzNX0.lsMUvu8IP3AU_2kEFkDFyBo_H2shkovtbEvmsZTmea8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
