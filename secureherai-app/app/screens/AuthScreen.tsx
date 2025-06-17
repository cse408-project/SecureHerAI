import React, { useState } from "react";
import { LoginScreen } from "./LoginScreen";
import { RegisterScreen } from "./RegisterScreen";
import { ForgotPasswordScreen } from "./ForgotPasswordScreen";
import { ResetPasswordScreen } from "./ResetPasswordScreen";
import { GoogleOAuthScreen } from "./GoogleOAuthScreen";
import { CompleteProfileScreen } from "./CompleteProfileScreen";

type AuthScreenType =
  | "login"
  | "register"
  | "forgot-password"
  | "reset-password"
  | "google-oauth"
  | "complete-profile";

export const AuthScreen: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreenType>("login");
  const [resetPasswordEmail, setResetPasswordEmail] = useState<string>("");

  const showLogin = () => setCurrentScreen("login");
  const showRegister = () => setCurrentScreen("register");
  const showForgotPassword = () => setCurrentScreen("forgot-password");
  const showResetPassword = (email: string = "") => {
    setResetPasswordEmail(email);
    setCurrentScreen("reset-password");
  };
  const showGoogleOAuth = () => setCurrentScreen("google-oauth");
  const showCompleteProfile = () => setCurrentScreen("complete-profile");

  const handleOAuthSuccess = () => {
    showCompleteProfile();
  };

  const handleProfileCompleted = () => {
    // After profile completion, user should be authenticated
    // This would typically trigger a re-render of the main app
    showLogin();
  };

  switch (currentScreen) {
    case "register":
      return <RegisterScreen onSwitchToLogin={showLogin} />;
    case "forgot-password":
      return (
        <ForgotPasswordScreen
          onBackToLogin={showLogin}
          onGoToResetPassword={showResetPassword}
        />
      );
    case "reset-password":
      return (
        <ResetPasswordScreen
          onBackToLogin={showLogin}
          prefilledEmail={resetPasswordEmail}
        />
      );
    case "google-oauth":
      return (
        <GoogleOAuthScreen onBack={showLogin} onSuccess={handleOAuthSuccess} />
      );
    case "complete-profile":
      return (
        <CompleteProfileScreen onProfileCompleted={handleProfileCompleted} />
      );
    case "login":
    default:
      return (
        <LoginScreen
          onSwitchToRegister={showRegister}
          onForgotPassword={showForgotPassword}
          onGoogleOAuth={showGoogleOAuth}
        />
      );
  }
};

export default AuthScreen;
