import { JwtService } from '@nestjs/jwt'
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'

import { Server, Socket } from 'socket.io'

@WebSocketGateway({
  cors: {
    origin: process.env.SOCKET_ORIGIN
      ? process.env.SOCKET_ORIGIN.split(',').map((origin) => origin.trim())
      : true,
  },
})
export class OrdersGateway {
  constructor(private readonly jwtService: JwtService) {}

  @WebSocketServer()
  server: Server

  @SubscribeMessage('tenant.join')
  handleJoinTenant(
    @ConnectedSocket() client: Socket,
    @MessageBody() tenantId: string,
  ) {
    const token = client.handshake.auth?.token as string | undefined

    if (!tenantId || !token) {
      return
    }

    try {
      const payload = this.jwtService.verify<{ tenantId: string }>(token)

      if (payload.tenantId !== tenantId) {
        return
      }

      client.join(`tenant:${tenantId}`)
    } catch {
      return
    }
  }

  emitOrderCreated(tenantId: string, order: any) {
    this.server
      .to(`tenant:${tenantId}`)
      .emit('order.created', order)
  }

  emitOrderUpdated(tenantId: string, order: any) {
    this.server
      .to(`tenant:${tenantId}`)
      .emit('order.updated', order)
  }

  emitOrderCancelled(tenantId: string, order: any) {
    this.server
      .to(`tenant:${tenantId}`)
      .emit('order.cancelled', order)
  }
}