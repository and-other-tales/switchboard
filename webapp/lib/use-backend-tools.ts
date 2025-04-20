import { useState, useEffect } from "react";
import { getSession } from "next-auth/react";

// Custom hook to fetch backend tools repeatedly
export function useBackendTools(url: string, intervalMs: number) {
  const [tools, setTools] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);

  // Get the auth token
  useEffect(() => {
    const getToken = async () => {
      const session = await getSession();
      // This will be a JWT from NextAuth
      if (session) {
        // @ts-ignore - token is not in the type but exists in the session
        setToken(session.id_token || null);
      }
    };
    
    getToken();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchTools = () => {
      // Only fetch when we have a token
      if (!token) return;
      
      fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then((res) => res.json())
        .then((data) => {
          if (isMounted) setTools(data);
        })
        .catch((error) => {
          // On failure, we just let it retry after interval
          console.error("Error fetching backend tools:", error);
        });
    };

    fetchTools();
    const intervalId = setInterval(fetchTools, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [url, intervalMs, token]);

  return tools;
}

// Helper to get the current IAM token
export async function getIamToken(): Promise<string | null> {
  const session = await getSession();
  // @ts-ignore - token is not in the type but exists in the session
  return session?.id_token || null;
}