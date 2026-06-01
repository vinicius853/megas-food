import { io, Socket } from 'socket.io-client'

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ''

let socket: Socket | null = null

export function getSocket() {
  if (!socket) {
    socket = SOCKET_URL ? io(SOCKET_URL) : io()
  }

  return socket
}
