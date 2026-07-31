import prisma from '../db.js';

export const raiseComplaint = async (req, res) => {
  const { hostelId, title, description } = req.body;
  const studentId = req.userId;

  try {
    const student = await prisma.user.findUnique({
      where: { id: studentId }
    });

    const hostel = await prisma.hostel.findUnique({
      where: { id: parseInt(hostelId) }
    });

    if (!student || !hostel) {
      return res.status(400).json({ message: "Invalid student or hostel reference." });
    }

    const complaint = await prisma.complaint.create({
      data: {
        studentId,
        hostelId: parseInt(hostelId),
        title,
        description,
        status: 'OPEN'
      }
    });

    return res.status(201).json(complaint);
  } catch (error) {
    console.error("Raise Complaint Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getStudentComplaints = async (req, res) => {
  const studentId = req.userId;

  try {
    const complaints = await prisma.complaint.findMany({
      where: { studentId },
      include: {
        hostel: true
      }
    });
    return res.status(200).json(complaints);
  } catch (error) {
    console.error("Get Student Complaints Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getOwnerComplaints = async (req, res) => {
  const ownerId = req.userId;

  try {
    const complaints = await prisma.complaint.findMany({
      where: {
        hostel: {
          ownerId
        }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        hostel: true
      }
    });
    return res.status(200).json(complaints);
  } catch (error) {
    console.error("Get Owner Complaints Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const replyToComplaint = async (req, res) => {
  const id = parseInt(req.params.id);
  const { ownerReply, status } = req.body;
  const ownerId = req.userId;

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        hostel: true
      }
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (complaint.hostel.ownerId !== ownerId) {
      return res.status(403).json({ message: "You do not own this hostel" });
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: {
        ownerReply,
        status: status || complaint.status
      }
    });

    return res.status(200).json(updatedComplaint);
  } catch (error) {
    console.error("Reply To Complaint Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
