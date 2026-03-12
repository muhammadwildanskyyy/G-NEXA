import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InvoicesUsecase } from '../invoices.usecase/invoices.usecase';
import { AppLogger } from '../../../infrastructure/logger/app.logger';

interface PaymentEventMessage {
  event: 'payment.success' | 'payment.expired' | 'payment.failed';
  timestamp: string;
  data: {
    transaction_id: string;
    invoice_id: string;
    user_id: string;
    amount: number;
    status: string;
  };
}

@Controller()
export class PaymentEventsConsumer {
  constructor(
    private readonly invoicesUsecase: InvoicesUsecase,
    private readonly logger: AppLogger,
  ) {}

  @EventPattern('payment.events')
  async handlePaymentEvent(
    @Payload() message: PaymentEventMessage,
  ) {
    const { event, data } = message;

    this.logger.info('consumer:payment', `Received ${event} event`, {
      invoice_id: data.invoice_id,
      transaction_id: data.transaction_id,
      status: data.status,
    });

    try {
      switch (event) {
        case 'payment.success':
          await this.invoicesUsecase.handlePaymentSuccess(data.invoice_id);
          break;

        case 'payment.expired':
        case 'payment.failed':
          await this.invoicesUsecase.handlePaymentFailed(data.invoice_id);
          break;

        default:
          this.logger.warning('consumer:payment', `Unknown payment event: ${event}`, {
            invoice_id: data.invoice_id,
          });
      }
    } catch (error) {
      this.logger.err('consumer:payment', `Failed to process ${event} event`, error, {
        invoice_id: data.invoice_id,
        transaction_id: data.transaction_id,
      });
    }
  }
}
