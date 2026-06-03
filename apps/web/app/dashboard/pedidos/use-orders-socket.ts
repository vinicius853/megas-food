import { useEffect, useRef } from 'react'

import { io } from 'socket.io-client'

type UseOrdersSocketProps = {
  loadOrders: () => void | Promise<void>
  playNewOrderSound: () => void
}

export function useOrdersSocket({
  loadOrders,
  playNewOrderSound,
}: UseOrdersSocketProps) {
  const loadOrdersRef = useRef(loadOrders)
  const playNewOrderSoundRef = useRef(playNewOrderSound)

  useEffect(() => {
    loadOrdersRef.current = loadOrders
    playNewOrderSoundRef.current = playNewOrderSound
  }, [loadOrders, playNewOrderSound])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const tenantId = localStorage.getItem('tenantId')

    if (!tenantId || !token) {
      return
    }

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      ''

    const socket = socketUrl
      ? io(socketUrl, {
          transports: ['websocket'],
          auth: {
            token,
          },
        })
      : io({
          transports: ['websocket'],
          auth: {
            token,
          },
        })

    socket.emit(
      'tenant.join',
      tenantId,
    )

    socket.on(
      'order.created',
      () => {
        loadOrdersRef.current()

        playNewOrderSoundRef.current()
      },
    )

    socket.on(
      'order.updated',
      () => {
        loadOrdersRef.current()
      },
    )

    socket.on(
      'order.cancelled',
      () => {
        loadOrdersRef.current()
      },
    )

    return () => {
      socket.disconnect()
    }
  }, [])
}
