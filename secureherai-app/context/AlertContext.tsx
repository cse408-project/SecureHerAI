import React, { createContext, useContext, useState, ReactNode } from "react";
import CustomAlert from "../components/CustomAlert";

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface AlertContextType {
  showAlert: (
    title: string,
    message: string,
    type?: "success" | "error" | "warning" | "info",
    buttons?: AlertButton[]
  ) => void;
  showConfirmAlert: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    type?: "success" | "error" | "warning" | "info"
  ) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "warning" | "info",
    onConfirm: () => {},
    onCancel: undefined as (() => void) | undefined,
    confirmText: "OK",
    cancelText: "Cancel",
    showCancel: false,
  });

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" | "warning" | "info" = "info",
    buttons?: AlertButton[]
  ) => {
    const primaryButton =
      buttons?.find((btn) => btn.style !== "cancel") || buttons?.[0];
    const cancelButton = buttons?.find((btn) => btn.style === "cancel");

    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      onConfirm: () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        if (primaryButton?.onPress) primaryButton.onPress();
      },
      onCancel: cancelButton
        ? () => {
            setAlertConfig((prev) => ({ ...prev, visible: false }));
            if (cancelButton.onPress) cancelButton.onPress();
          }
        : undefined,
      confirmText: primaryButton?.text || "OK",
      cancelText: cancelButton?.text || "Cancel",
      showCancel: !!cancelButton,
    });
  };

  const showConfirmAlert = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    type: "success" | "error" | "warning" | "info" = "info"
  ) => {
    console.log('🚨 showConfirmAlert called with:', { title, message, type });
    
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      onConfirm: () => {
        console.log('🚨 Confirm button pressed');
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        onConfirm();
      },
      onCancel: onCancel
        ? () => {
            console.log('🚨 Cancel button pressed');
            setAlertConfig((prev) => ({ ...prev, visible: false }));
            onCancel();
          }
        : () => {
            console.log('🚨 Default cancel action');
            setAlertConfig((prev) => ({ ...prev, visible: false }));
          },
      confirmText: "Confirm",
      cancelText: "Cancel",
      showCancel: true,
    });
    
    console.log('🚨 Alert config set, should show modal now');
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirmAlert }}>
      {children}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        showCancel={alertConfig.showCancel}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}
