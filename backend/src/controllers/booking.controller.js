import prisma from '../db.js';

export const createBooking = async (req, res) => {
  const { roomId, startDate, endDate } = req.body;
  const studentId = req.userId;

  try {
    const student = await prisma.user.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(401).json({ message: "Student not found" });
    }

    const room = await prisma.room.findUnique({
      where: { id: parseInt(roomId) }
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.status !== 'AVAILABLE') {
      return res.status(400).json({ message: "Room is not available for booking" });
    }

    const booking = await prisma.booking.create({
      data: {
        studentId,
        roomId: parseInt(roomId),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'PENDING'
      }
    });

    return res.status(201).json(booking);
  } catch (error) {
    console.error("Create Booking Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getStudentBookings = async (req, res) => {
  const studentId = req.userId;

  try {
    const bookings = await prisma.booking.findMany({
      where: { studentId },
      include: {
        room: {
          include: {
            hostel: true
          }
        }
      }
    });
    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Get Student Bookings Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getOwnerBookings = async (req, res) => {
  const ownerId = req.userId;

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        room: {
          hostel: {
            ownerId
          }
        }
      },
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
    });
    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Get Owner Bookings Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const updateBookingStatus = async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const ownerId = req.userId;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            hostel: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.room.hostel.ownerId !== ownerId) {
      return res.status(403).json({ message: "You do not own this hostel listing" });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status }
    });

    if (status === 'ACCEPTED') {
      // 1. Mark room status occupied
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { status: 'OCCUPIED' }
      });

      // 2. Generate Security Deposit Invoice (1 Month Rent)
      await prisma.invoice.create({
        data: {
          bookingId: booking.id,
          amount: booking.room.pricePerMonth,
          dueDate: booking.startDate,
          status: 'PENDING',
          billingMonth: "Security Deposit (Advance)"
        }
      });

      // 3. Pre-generate monthly invoices for booking duration
      let current = new Date(booking.startDate);
      const end = new Date(booking.endDate);

      while (current < end || (current.getMonth() === end.getMonth() && current.getFullYear() === end.getFullYear())) {
        let dueDate = new Date(current.getFullYear(), current.getMonth(), 1);
        if (dueDate < booking.startDate) {
          dueDate = booking.startDate;
        }

        const billingMonth = current.toLocaleString('en-US', { month: 'long' }).toUpperCase() + " " + current.getFullYear();

        await prisma.invoice.create({
          data: {
            bookingId: booking.id,
            amount: booking.room.pricePerMonth,
            dueDate,
            status: 'PENDING',
            billingMonth
          }
        });

        // Advance to next month
        current.setMonth(current.getMonth() + 1);
        current.setDate(1);
      }
    } else if (status === 'CANCELLED' || status === 'REJECTED') {
      // Reset room to available if occupied
      if (booking.room.status === 'OCCUPIED') {
        await prisma.room.update({
          where: { id: booking.roomId },
          data: { status: 'AVAILABLE' }
        });
      }
    }

    return res.status(200).json(updatedBooking);
  } catch (error) {
    console.error("Update Booking Status Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const terminateBooking = async (req, res) => {
  const id = parseInt(req.params.id);
  const ownerId = req.userId;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            hostel: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.room.hostel.ownerId !== ownerId) {
      return res.status(403).json({ message: "You do not own this hostel listing" });
    }

    // Set status cancelled
    await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    // Set room status available
    await prisma.room.update({
      where: { id: booking.roomId },
      data: { status: 'AVAILABLE' }
    });

    // Delete outstanding pending invoices
    await prisma.invoice.deleteMany({
      where: {
        bookingId: id,
        status: 'PENDING'
      }
    });

    return res.status(200).send("Booking terminated and room released successfully.");
  } catch (error) {
    console.error("Terminate Booking Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const changeCheckoutDate = async (req, res) => {
  const id = parseInt(req.params.id);
  const { endDate } = req.body;
  const studentId = req.userId;

  if (!endDate) {
    return res.status(400).json({ message: "endDate is required" });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: true
      }
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.studentId !== studentId) {
      return res.status(403).json({ message: "You do not own this booking" });
    }

    const newEndDate = new Date(endDate);
    if (newEndDate < booking.startDate) {
      return res.status(400).json({ message: "Checkout date cannot be before check-in date" });
    }

    // Update booking end date
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { endDate: newEndDate },
      include: {
        room: true
      }
    });

    // Get existing invoices
    const existingInvoices = await prisma.invoice.findMany({
      where: { bookingId: id }
    });

    const paidMonths = new Set(
      existingInvoices
        .filter(inv => inv.status === 'PAID')
        .map(inv => inv.billingMonth)
    );

    // Delete pending monthly invoices (except security deposit)
    await prisma.invoice.deleteMany({
      where: {
        bookingId: id,
        status: 'PENDING',
        NOT: {
          billingMonth: "Security Deposit (Advance)"
        }
      }
    });

    // Re-generate monthly invoices up to newEndDate
    let current = new Date(booking.startDate);
    const end = new Date(newEndDate);

    while (current < end || (current.getMonth() === end.getMonth() && current.getFullYear() === end.getFullYear())) {
      const billingMonth = current.toLocaleString('en-US', { month: 'long' }).toUpperCase() + " " + current.getFullYear();

      if (!paidMonths.has(billingMonth)) {
        let dueDate = new Date(current.getFullYear(), current.getMonth(), 1);
        if (dueDate < booking.startDate) {
          dueDate = booking.startDate;
        }

        await prisma.invoice.create({
          data: {
            bookingId: id,
            amount: booking.room.pricePerMonth,
            dueDate,
            status: 'PENDING',
            billingMonth
          }
        });
      }

      // Advance to next month
      current.setMonth(current.getMonth() + 1);
      current.setDate(1);
    }

    return res.status(200).json(updatedBooking);
  } catch (error) {
    console.error("Change Checkout Date Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
