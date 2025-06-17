import React, { useState } from "react";
import { useRouter } from "expo-router";
import { ForgotPasswordScreen } from "./screens/ForgotPasswordScreen";
import { ResetPasswordScreen } from "./screens/ResetPasswordScreen";

export default function ForgotPassword() {
  const router = useRouter();
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState("");

  const handleBackToLogin = () => {
    router.replace("/");
  };

  const handleGoToResetPassword = (email: string) => {
    setResetPasswordEmail(email);
    setShowResetPassword(true);
  };

  if (showResetPassword) {
    return (
      <ResetPasswordScreen
        onBackToLogin={handleBackToLogin}
        prefilledEmail={resetPasswordEmail}
      />
    );
  }

  return (
    <ForgotPasswordScreen
      onBackToLogin={handleBackToLogin}
      onGoToResetPassword={handleGoToResetPassword}
    />
  );
}
