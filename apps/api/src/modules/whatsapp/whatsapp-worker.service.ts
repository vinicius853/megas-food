import { Injectable, OnModuleInit } from '@nestjs/common';
import { WhatsAppNotificationStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { WhatsAppOutboxService } from './whatsapp-outbox.service';

@Injectable()
export class WhatsAppWorkerService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: WhatsAppOutboxService,
  ) {}

  async onModuleInit() {
    const pending = await this.prisma.whatsAppNotification.findMany({
      where: {
        status: WhatsAppNotificationStatus.PENDING,
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    pending.forEach((notification) => this.outbox.schedule(notification.id));
  }
}
