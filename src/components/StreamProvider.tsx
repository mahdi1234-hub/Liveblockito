"use client";

import {
  StreamVideoClient,
  StreamVideo,
  User,
} from "@stream-io/video-react-sdk";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface StreamContextType {
  client: StreamVideoClient | null;
  userId: string;
  userName: string;
  userImage: string;
}

const StreamContext = createContext<StreamContextType>({
  client: null,
  userId: "",
  userName: "",
  userImage: "",
});

export function useStreamContext() {
  return useContext(StreamContext);
}

export function StreamProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [userImage, setUserImage] = useState("");

  useEffect(() => {
    let videoClient: StreamVideoClient | null = null;

    async function init() {
      try {
        const res = await fetch("/api/stream-token");
        if (!res.ok) return;
        const data = await res.json();

        const user: User = {
          id: data.userId,
          name: data.userName,
          image: data.userImage,
        };

        videoClient = new StreamVideoClient({
          apiKey: data.apiKey,
          user,
          token: data.token,
        });

        setClient(videoClient);
        setUserId(data.userId);
        setUserName(data.userName);
        setUserImage(data.userImage);
      } catch (err) {
        console.error("Failed to initialize Stream client:", err);
      }
    }

    init();

    return () => {
      if (videoClient) {
        videoClient.disconnectUser();
      }
    };
  }, []);

  if (!client) {
    return (
      <StreamContext.Provider
        value={{ client: null, userId, userName, userImage }}
      >
        {children}
      </StreamContext.Provider>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamContext.Provider value={{ client, userId, userName, userImage }}>
        {children}
      </StreamContext.Provider>
    </StreamVideo>
  );
}
