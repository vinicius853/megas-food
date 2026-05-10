import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'

import { Server } from 'socket.io'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class OrdersGateway {
  @WebSocketServer()
  server: Server

  emitOrderCreated(tenantId: string, order: any) {
    this.server.emit(`tenant:${tenantId}:order.created`, order)
  }

  emitOrderUpdated(tenantId: string, order: any) {
    this.server.emit(`tenant:${tenantId}:order.updated`, order)
  }

  emitOrderCancelled(tenantId: string, order: any) {
    this.server.emit(`tenant:${tenantId}:order.cancelled`, order)
  }
}
