'use client';

import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';

interface OrderItem {
  id: string;
  product_name?: string;
  name?: string;
  quantity: number;
  unit_price?: number;
  sale_price?: number;
  total: number | string;
}

interface PaymentInfo {
  id: string;
  amount: number;
  method: string;
  status: string;
  reference?: string;
  mpesa_receipt_number?: string;
  timestamp: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabNumber: number;
  tabId: string;
  venueName: string;
  venueLogo?: string;
  customerName: string;
  orders: OrderItem[];
  payment: PaymentInfo;
  openedAt: string;
}

export function ReceiptModal({
  isOpen,
  onClose,
  tabNumber,
  tabId,
  venueName,
  venueLogo,
  customerName,
  orders,
  payment,
  openedAt,
}: ReceiptModalProps) {
  if (!isOpen) return null;

  const confirmedOrders = orders.filter((o) => {
    const total = typeof o.total === 'string' ? parseFloat(o.total) : o.total;
    return total > 0;
  });

  const orderTotal = confirmedOrders.reduce((sum, o) => {
    return sum + (typeof o.total === 'string' ? parseFloat(o.total) : o.total);
  }, 0);

  const paidAmount = typeof payment.amount === 'string'
    ? parseFloat(payment.amount)
    : payment.amount;

  const verificationData = JSON.stringify({
    t: tabId,
    p: payment.id,
    a: paidAmount,
  });

  const receiptDate = new Date().toLocaleDateString('en-KE', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          backgroundColor: 'var(--ink)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="flex justify-end p-3">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10"
            style={{ color: 'var(--muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Receipt content */}
        <div className="px-6 pb-6">
          {/* Venue logo + name */}
          <div className="text-center mb-6">
            {venueLogo ? (
              <img
                src={venueLogo}
                alt={venueName}
                className="h-16 mx-auto mb-3 object-contain"
              />
            ) : (
              <div className="text-2xl font-black mb-3" style={{ color: 'var(--amber)' }}>
                {venueName.charAt(0)}
              </div>
            )}
            <h2 className="text-lg font-bold" style={{ color: 'var(--cream)' }}>
              {venueName}
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Tab #{tabNumber} • {receiptDate}
            </p>
          </div>

          {/* Customer name */}
          <div
            className="rounded-lg p-3 mb-4 text-center"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Served to
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--cream)' }}>
              {customerName}
            </p>
          </div>

          {/* Orders */}
          {confirmedOrders.length > 0 && (
            <div className="mb-4">
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                Orders
              </p>
              <div
                className="rounded-lg overflow-hidden"
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {confirmedOrders.map((item, i) => {
                  const itemTotal =
                    typeof item.total === 'string'
                      ? parseFloat(item.total)
                      : item.total;
                  const itemPrice =
                    item.unit_price ?? item.sale_price ?? itemTotal / (item.quantity || 1);
                  const name = item.product_name ?? item.name ?? 'Item';

                  return (
                    <div
                      key={item.id || i}
                      className="flex items-center justify-between px-3 py-2.5"
                      style={{
                        borderBottom:
                          i < confirmedOrders.length - 1
                            ? '1px solid rgba(255,255,255,0.06)'
                            : undefined,
                      }}
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p
                          className="text-sm truncate"
                          style={{ color: 'var(--cream)' }}
                        >
                          {item.quantity > 1 && (
                            <span style={{ color: 'var(--amber)' }}>
                              {item.quantity}x{' '}
                            </span>
                          )}
                          {name}
                        </p>
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--cream)' }}>
                        KES {itemTotal.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Totals */}
          <div
            className="rounded-lg p-3 mb-5"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                Order Total
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--cream)' }}>
                KES {orderTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                Paid via {payment.method.toUpperCase()}
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--amber)' }}>
                KES {paidAmount.toLocaleString()}
              </span>
            </div>
            {payment.mpesa_receipt_number && (
              <div className="mt-2 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  M-Pesa Ref: {payment.mpesa_receipt_number}
                </p>
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center mb-4">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: '#fff' }}
            >
              <QRCodeSVG
                value={verificationData}
                size={160}
                level="M"
                fgColor="#000000"
              />
            </div>
            <p className="text-xs mt-2 text-center" style={{ color: 'var(--muted)' }}>
              Scan to verify this receipt
            </p>
          </div>

          {/* Footer */}
          <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Thank you for visiting {venueName}
          </p>
        </div>
      </div>
    </div>
  );
}
