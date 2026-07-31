import prisma from '../db.js';

export const getStudentInvoices = async (req, res) => {
  const studentId = req.userId;

  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        booking: {
          studentId
        }
      },
      include: {
        payments: true,
        booking: {
          include: {
            room: {
              include: {
                hostel: true
              }
            }
          }
        }
      }
    });

    return res.status(200).json(invoices);
  } catch (error) {
    console.error("Get Student Invoices Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getOwnerInvoices = async (req, res) => {
  const ownerId = req.userId;

  try {
    const invoices = await prisma.invoice.findMany({
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
        payments: true,
        booking: {
          include: {
            student: {
              select: {
                id: true,
                username: true,
                email: true,
                name: true,
                phone: true
              }
            },
            room: {
              include: {
                hostel: true
              }
            }
          }
        }
      }
    });

    return res.status(200).json(invoices);
  } catch (error) {
    console.error("Get Owner Invoices Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
