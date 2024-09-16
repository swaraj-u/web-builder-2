import { io } from "socket.io-client";
import React from "react";
const SOCKET_URL = "https://web-builder-sepia-alpha.vercel.app";
export const socket = io(SOCKET_URL);
// app context
export const AppContext = React.createContext();
