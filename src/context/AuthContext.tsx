import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser, testConnection, db } from '../database/firebase';
import { SyncManager } from '../database/sync-manager';
import { disableNetwork } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isSyncing: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  isSyncing: false,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Test initial connection to Firestore per skill
    testConnection().catch(() => {});

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          let tokenReady = true;
          try {
            await currentUser.getIdToken(false);
          } catch (tErr: any) {
            tokenReady = false;
            const tMsg = tErr?.message || '';
            if (tMsg.includes('token-service-api-has-not-been-used')) {
              console.warn('[AuthProvider] Token service not active; operating in offline localDB mode.');
              try {
                await disableNetwork(db);
              } catch {}
            }
          }

          if (tokenReady) {
            setIsSyncing(true);
            try {
              await SyncManager.syncFromCloud(currentUser.uid);
            } catch (err: any) {
              const msg = err?.message || String(err);
              if (msg.includes('token-service-api-has-not-been-used')) {
                try {
                  await disableNetwork(db);
                } catch {}
              } else {
                console.warn('[AuthProvider] Cloud sync note:', msg);
              }
            } finally {
              setIsSyncing(false);
            }
          }
        }
      },
      (error) => {
        console.warn('[AuthProvider] Auth state observation note:', error?.message || error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const u = await loginWithGoogle();
      if (u) setUser(u);
    } catch (err: any) {
      console.warn('Google Sign-in note:', err);
    }
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isSyncing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
