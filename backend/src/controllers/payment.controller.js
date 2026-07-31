import prisma from '../db.js';

export const processPayment = async (req, res) => {
  const { invoiceId, amount, paymentMethod, transactionId, screenshot } = req.body;
  const userId = req.userId;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(invoiceId) },
      include: {
        booking: {
          include: {
            student: true,
            room: {
              include: {
                hostel: true
              }
            }
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const booking = invoice.booking;
    const isStudent = booking.student.id === userId;
    const isOwner = booking.room.hostel.ownerId === userId;

    if (!isStudent && !isOwner) {
      return res.status(403).json({ message: "You do not have permission to process payments for this invoice" });
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({ message: "Invoice is already paid" });
    }

    // Validation: for online payments (non-CASH), either transaction ID or screenshot is required
    if (paymentMethod !== 'CASH' && (!transactionId || transactionId.trim() === '') && (!screenshot || screenshot.trim() === '')) {
      return res.status(400).json({ message: "Either Transaction ID or payment screenshot is required." });
    }

    // Mark invoice paid
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'PAID' }
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        invoiceId: invoice.id,
        amount: parseFloat(amount),
        paymentMethod,
        status: 'SUCCESS',
        transactionId: transactionId && transactionId.trim() !== '' ? transactionId.trim() : (paymentMethod === 'CASH' ? `TXN-CASH-${Date.now()}` : `TXN-PENDING-${Date.now()}`),
        screenshot: screenshot || null
      }
    });

    return res.status(201).json(payment);
  } catch (error) {
    console.error("Process Payment Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getStudentPayments = async (req, res) => {
  const studentId = req.userId;

  try {
    const payments = await prisma.payment.findMany({
      where: {
        booking: {
          studentId
        }
      },
      include: {
        booking: {
          include: {
            room: {
              include: {
                hostel: true
              }
            }
          }
        },
        invoice: true
      }
    });

    return res.status(200).json(payments);
  } catch (error) {
    console.error("Get Student Payments Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getOwnerPayments = async (req, res) => {
  const ownerId = req.userId;

  try {
    const payments = await prisma.payment.findMany({
      where: {
        booking: {
          room: {
            hostel: {
              ownerId
            }
          }
        }
      },
      include: {
        booking: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            room: {
              include: {
                hostel: true
              }
            }
          }
        },
        invoice: true
      }
    });

    return res.status(200).json(payments);
  } catch (error) {
    console.error("Get Owner Payments Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
