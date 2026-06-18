import { useEffect, useRef } from 'react'

import { io } from 'socket.io-client'

const socketRefreshWindowMs = 500

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

    let refreshTimer: ReturnType<typeof setTimeout> | null = null
    let hasCreatedOrder = false

    const scheduleRefresh = (createdOrder = false) => {
      hasCreatedOrder = hasCreatedOrder || createdOrder

      if (refreshTimer) return

      refreshTimer = setTimeout(() => {
        refreshTimer = null

        void loadOrdersRef.current()

        if (hasCreatedOrder) {
          playNewOrderSoundRef.current()
          hasCreatedOrder = false
        }
      }, socketRefreshWindowMs)
    }

    socket.on(
      'order.created',
      () => {
        scheduleRefresh(true)
      },
    )

    socket.on(
      'order.updated',
      () => {
        scheduleRefresh()
      },
    )

    socket.on(
      'order.cancelled',
      () => {
        scheduleRefresh()
      },
    )

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
      }

      socket.disconnect()
    }
  }, [])
}
