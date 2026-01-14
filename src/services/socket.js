import { io } from "socket.io-client";
import { auth } from "../../firebase";

const SOCKET_URL = "https://41bbbbbf-93d5-4a52-aef1-e65635945258-00-3tcqp4xlzxntf.pike.replit.dev";

let socket;

export async function initSocket() {
  const token = await auth.currentUser.getIdToken();
  socket = io(SOCKET_URL, {
    auth: {
      uid: auth.currentUser.uid,
      token,
    },
  });

  return socket;
}

export function getSocket() {
  return socket;
}
