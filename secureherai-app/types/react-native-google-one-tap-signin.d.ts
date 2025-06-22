declare module 'react-native-google-one-tap-signin' {
  const GoogleOneTapSignIn: {
    savePassword: (username: string, password: string) => Promise<void>;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    deletePassword: (username: string, password: string) => Promise<void>;
  };
  export default GoogleOneTapSignIn;
}