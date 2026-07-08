import {
  getCurrentUser,
  login,
  logout,
  register,
  setAuthTokenGetter,
  type RegisterInput,
  type UserProfile,
} from "@workspace/api-client-react";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

const TOKEN_KEY = "session_token";

async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof localStorage !== "undefined"
      ? localStorage.getItem(TOKEN_KEY)
      : null;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function setStoredToken(token: string | null): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage === "undefined") return;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    return;
  }
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

type AuthContextValue = {
  user: UserProfile | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    setAuthTokenGetter(() => tokenRef.current);
    return () => setAuthTokenGetter(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await getStoredToken();
        if (stored) {
          tokenRef.current = stored;
          try {
            const profile = await getCurrentUser();
            if (!cancelled) setUser(profile);
          } catch {
            tokenRef.current = null;
            await setStoredToken(null);
          }
        }
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const res = await login({ identifier, password });
    tokenRef.current = res.token;
    await setStoredToken(res.token);
    setUser(res.user);
  }, []);

  const signUp = useCallback(async (input: RegisterInput) => {
    const res = await register(input);
    tokenRef.current = res.token;
    await setStoredToken(res.token);
    setUser(res.user);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } catch {
      // Session may already be gone server-side; clear locally regardless.
    }
    tokenRef.current = null;
    await setStoredToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoaded,
        isSignedIn: !!user,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
