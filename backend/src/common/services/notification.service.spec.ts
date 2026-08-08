import { NotificationService, OrderShippedEvent } from './notification.service';

/**
 * NotificationService — order.shipped notification tests.
 * Transport is swapped for a spy; asserts the composed message carries the
 * courier tracking ID and the storefront tracking page link.
 */
describe('NotificationService', () => {
  let service: NotificationService;
  let sendSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new NotificationService({
      get: jest.fn((_key: string, fallback?: unknown) => fallback),
    } as any);

    sendSpy = jest
      .spyOn(service as any, 'sendWhatsAppMessage')
      .mockResolvedValue(undefined);
  });

  const shippedEvent: OrderShippedEvent = {
    orderId: 'order-1',
    orderNumber: 'ORD-1001',
    customerName: 'Test Fan',
    customerPhone: '+919000000000',
    customerEmail: 'fan@test.com',
    trackingId: 'TRK-12345',
    trackingUrl: 'https://fanclub.example/orders/order-1',
  };

  it('sends a shipment notification containing the tracking ID and tracking link', async () => {
    await (service as any).handleOrderShipped(shippedEvent);

    expect(sendSpy).toHaveBeenCalledTimes(1);
    const [phone, message] = sendSpy.mock.calls[0];
    expect(phone).toBe('+919000000000');
    expect(message).toContain('Order Has Shipped');
    expect(message).toContain('TRK-12345');
    expect(message).toContain('https://fanclub.example/orders/order-1');
  });

  it('does not attempt delivery when no phone number is available', async () => {
    await (service as any).handleOrderShipped({
      ...shippedEvent,
      customerPhone: null,
    });

    expect(sendSpy).not.toHaveBeenCalled();
  });

  it('sends an email with the tracking link when an email address is available', async () => {
    const emailSpy = jest
      .spyOn(service as any, 'sendEmailMessage')
      .mockResolvedValue(undefined);

    await (service as any).handleOrderShipped(shippedEvent);

    expect(emailSpy).toHaveBeenCalledTimes(1);
    const [to, subject, body] = emailSpy.mock.calls[0];
    expect(to).toBe('fan@test.com');
    expect(subject).toContain('has shipped');
    expect(body).toContain('https://fanclub.example/orders/order-1');
  });

  it('strips newlines from the tracking ID in the message body', () => {
    const message = (service as any).composeOrderShippedMessage({
      ...shippedEvent,
      trackingId: 'TRK-123\nsecond-line',
    });

    expect(message).not.toContain('\nsecond-line');
    expect(message).toContain('TRK-123 second-line');
  });
});
