import { Platform } from "react-native";

export const API_URL =
  Platform.OS === "web"
    ? "http://localhost:5000"
    : "http://192.168.101.8:5000"; // Cambia la IP según tu red