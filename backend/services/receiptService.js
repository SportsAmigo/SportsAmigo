/**
 * Receipt Generation Service
 * Generates PDF receipts for subscription and VAS purchases using pdfkit.
 *
 * Receipts contain:
 * - Organizer Name
 * - Product Type (Subscription / VAS)
 * - Plan/Package Name
 * - Billing Cycle (if subscription)
 * - Event Name & ID (if VAS)
 * - Amount Paid
 * - Transaction ID
 * - Date & Time
 * - Payment Status
 */

const PDFDocument = require('pdfkit');

/**
 * Build a receipt PDF and return it as a Buffer.
 *
 * @param {Object} data
 * @param {string} data.organizerName
 * @param {string} data.productType      - 'Subscription' | 'VAS'
 * @param {string} data.planOrPackage     - e.g. 'Pro Plan' or 'Event Insurance - Premium'
 * @param {string} [data.billingCycle]    - 'monthly' | 'yearly'
 * @param {string} [data.eventName]       - Event name (VAS only)
 * @param {string} [data.eventId]         - Event ID (VAS only)
 * @param {number} data.amount
 * @param {string} data.transactionId
 * @param {string} data.dateTime          - ISO string or formatted string
 * @param {string} data.paymentStatus     - 'SUCCESS' | 'FAILED' etc.
 * @returns {Promise<Buffer>}
 */
function generateReceiptPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 100; // margin*2

      // ─── Header ───────────────────────────────────────────────
      doc
        .rect(50, 50, pageWidth, 60)
        .fill('#DC2626');

      doc
        .fontSize(22)
        .fillColor('#FFFFFF')
        .text('SportsAmigo', 70, 65, { width: pageWidth - 40 })
        .fontSize(10)
        .text('Payment Receipt', 70, 90, { width: pageWidth - 40 });

      // ─── Receipt header row ───────────────────────────────────
      const startY = 140;
      doc
        .fillColor('#111827')
        .fontSize(14)
        .text('PAYMENT RECEIPT', 50, startY, { width: pageWidth, align: 'center' });

      doc
        .moveTo(50, startY + 25)
        .lineTo(50 + pageWidth, startY + 25)
        .strokeColor('#E5E7EB')
        .stroke();

      // ─── Details table ────────────────────────────────────────
      let y = startY + 40;
      const labelX = 60;
      const valueX = 250;

      const addRow = (label, value) => {
        doc
          .fontSize(11)
          .fillColor('#6B7280')
          .text(label, labelX, y)
          .fillColor('#111827')
          .font('Helvetica-Bold')
          .text(String(value), valueX, y)
          .font('Helvetica');
        y += 26;
      };

      addRow('Transaction ID', data.transactionId);
      addRow('Date & Time', data.dateTime || new Date().toLocaleString());
      addRow('Payment Status', data.paymentStatus);

      // Separator
      y += 6;
      doc.moveTo(60, y).lineTo(50 + pageWidth - 10, y).strokeColor('#E5E7EB').stroke();
      y += 16;

      addRow('Organizer', data.organizerName);
      addRow('Product Type', data.productType);
      addRow('Plan / Package', data.planOrPackage);

      if (data.billingCycle) {
        addRow('Billing Cycle', data.billingCycle.charAt(0).toUpperCase() + data.billingCycle.slice(1));
      }

      if (data.eventName) {
        addRow('Event', data.eventName);
      }
      if (data.eventId) {
        addRow('Event ID', data.eventId);
      }

      // Amount highlight
      y += 10;
      doc.moveTo(60, y).lineTo(50 + pageWidth - 10, y).strokeColor('#2563EB').lineWidth(2).stroke();
      y += 14;
      doc.lineWidth(1);

      doc
        .fontSize(14)
        .fillColor('#111827')
        .font('Helvetica-Bold')
        .text('Total Amount', labelX, y)
        .fillColor('#2563EB')
        .fontSize(16)
        .text(`INR ${Number(data.amount).toLocaleString('en-IN')}`, valueX, y - 1)
        .font('Helvetica');

      // ─── Footer ───────────────────────────────────────────────
      y += 60;
      doc
        .fontSize(9)
        .fillColor('#9CA3AF')
        .text('This is a computer-generated receipt and does not require a signature.', 50, y, {
          width: pageWidth,
          align: 'center'
        })
        .text('Thank you for your purchase!', 50, y + 14, {
          width: pageWidth,
          align: 'center'
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateReceiptPDF };
