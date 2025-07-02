import React, { createContext, useState, useContext, ReactNode } from "react";
import { Alert, Platform } from "react-native";
import { WebAlert } from "../components/WebAlert";

// Define alert button types to match React Native Alert API
export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

// Define the context interface
interface AlertContextType {
  showAlert: (title: string, message: string, buttons: AlertButton[]) => void;
}

// Create the context
const AlertContext = createContext<AlertContextType | null>(null);

// Provider component
export function AlertProvider({ children }: { children: ReactNode }) {
  // State for the web alert modal
  const [webAlertVisible, setWebAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    buttons: AlertButton[];
  }>({
    title: "",
    message: "",
    buttons: [],
  });

  // The universal alert function
  const showAlert = (
    title: string,
    message: string,
    buttons: AlertButton[]
  ) => {
    if (Platform.OS === "web") {
      // For web, show our custom web alert modal
      setAlertConfig({
        title,
        message,
        buttons: buttons.map((btn) => ({
          ...btn,
          onPress: btn.onPress || (() => {}),
        })),
      });
      setWebAlertVisible(true);
    } else {
      // For native platforms, use the native Alert
      Alert.alert(
        title,
        message,
        buttons.map((btn) => ({
          text: btn.text,
          onPress: btn.onPress,
          style: btn.style,
        }))
      );
    }
  };

  // Close the web alert modal
  const handleClose = () => {
    setWebAlertVisible(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}

      {/* Render the WebAlert component for web platform */}
      {Platform.OS === "web" && (
        <WebAlert
          visible={webAlertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={handleClose}
        />
      )}
    </AlertContext.Provider>
  );
}

// Custom hook to use the alert system
export function useAlert() {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }

  return context;
}

// Direct export function for non-component usage
let globalShowAlert:
  | ((title: string, message: string, buttons: AlertButton[]) => void)
  | null = null;

export function setGlobalAlertFunction(
  fn: (title: string, message: string, buttons: AlertButton[]) => void
) {
  globalShowAlert = fn;
}

// This function can be imported and used anywhere without needing the hook
export function showAlert(
  title: string,
  message: string,
  buttons: AlertButton[]
) {
  if (globalShowAlert) {
    globalShowAlert(title, message, buttons);
  } else if (Platform.OS === "web") {
    // Fallback for web if context is not available
    console.warn(
      "AlertProvider not found. Using direct web alert implementation."
    );
    const alertElement = document.createElement("div");
    alertElement.style.position = "fixed";
    alertElement.style.top = "0";
    alertElement.style.left = "0";
    alertElement.style.width = "100%";
    alertElement.style.height = "100%";
    alertElement.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    alertElement.style.display = "flex";
    alertElement.style.justifyContent = "center";
    alertElement.style.alignItems = "center";
    alertElement.style.zIndex = "9999";

    const alertBox = document.createElement("div");
    alertBox.style.backgroundColor = "white";
    alertBox.style.padding = "20px";
    alertBox.style.borderRadius = "8px";
    alertBox.style.maxWidth = "300px";
    alertBox.style.width = "100%";

    const titleElement = document.createElement("h3");
    titleElement.textContent = title;

    const messageElement = document.createElement("p");
    messageElement.textContent = message;

    alertBox.appendChild(titleElement);
    alertBox.appendChild(messageElement);

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "flex-end";
    buttonContainer.style.marginTop = "15px";

    buttons.forEach((button) => {
      const btnElement = document.createElement("button");
      btnElement.textContent = button.text;
      btnElement.style.marginLeft = "10px";
      btnElement.style.padding = "8px 16px";
      btnElement.style.border = "none";
      btnElement.style.borderRadius = "4px";
      btnElement.style.cursor = "pointer";

      if (button.style === "destructive") {
        btnElement.style.backgroundColor = "#ff3b30";
        btnElement.style.color = "white";
      } else if (button.style === "cancel") {
        btnElement.style.backgroundColor = "#e0e0e0";
        btnElement.style.color = "black";
      } else {
        btnElement.style.backgroundColor = "#67082F";
        btnElement.style.color = "white";
      }

      btnElement.onclick = () => {
        if (button.onPress) button.onPress();
        document.body.removeChild(alertElement);
      };

      buttonContainer.appendChild(btnElement);
    });

    alertBox.appendChild(buttonContainer);
    alertElement.appendChild(alertBox);
    document.body.appendChild(alertElement);
  } else {
    // Fallback for native if context is not available
    Alert.alert(
      title,
      message,
      buttons.map((btn) => ({
        text: btn.text,
        onPress: btn.onPress,
        style: btn.style,
      }))
    );
  }
}
