import prisma from '../db.js';

export const getAllHostels = async (req, res) => {
  const { city } = req.query;

  try {
    const hostels = await prisma.hostel.findMany({
      where: city && city.trim() !== '' ? {
        city: {
          contains: city.trim(),
          mode: 'insensitive'
        }
      } : {},
      include: {
        facilities: true,
        images: true
      }
    });

    return res.status(200).json(hostels);
  } catch (error) {
    console.error("Get All Hostels Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getHostelById = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const hostel = await prisma.hostel.findUnique({
      where: { id },
      include: {
        facilities: true,
        images: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    const rooms = await prisma.room.findMany({
      where: { hostelId: id },
      include: {
        bookings: {
          where: { status: 'ACCEPTED' },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    return res.status(200).json({
      hostel,
      rooms
    });
  } catch (error) {
    console.error("Get Hostel By Id Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const createHostel = async (req, res) => {
  const { name, description, address, city, contactNumber, upiId, bankAccount, facilityIds, imageUrls } = req.body;
  const ownerId = req.userId;

  try {
    const owner = await prisma.user.findUnique({
      where: { id: ownerId }
    });

    if (!owner) {
      return res.status(401).json({ message: "Owner not found" });
    }

    // Prepare facility connection
    const connectFacilities = facilityIds ? facilityIds.map(fId => ({ id: parseInt(fId) })) : [];

    // Prepare images data
    const createImages = imageUrls ? imageUrls
      .filter(url => url && url.trim() !== '')
      .map(url => ({ imageUrl: url.trim() })) : [];

    const hostel = await prisma.hostel.create({
      data: {
        name,
        description,
        address,
        city,
        contactNumber,
        upiId,
        bankAccount,
        ownerId,
        facilities: {
          connect: connectFacilities
        },
        images: {
          create: createImages
        }
      },
      include: {
        facilities: true,
        images: true
      }
    });

    return res.status(201).json(hostel);
  } catch (error) {
    console.error("Create Hostel Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const addRoomToHostel = async (req, res) => {
  const id = parseInt(req.params.id);
  const { roomNumber, roomType, capacity, pricePerMonth } = req.body;
  const ownerId = req.userId;

  try {
    const hostel = await prisma.hostel.findUnique({
      where: { id }
    });

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    if (hostel.ownerId !== ownerId) {
      return res.status(403).json({ message: "You do not own this hostel" });
    }

    const room = await prisma.room.create({
      data: {
        hostelId: id,
        roomNumber,
        roomType,
        capacity: parseInt(capacity),
        pricePerMonth: parseFloat(pricePerMonth),
        status: 'AVAILABLE'
      }
    });

    return res.status(201).json(room);
  } catch (error) {
    console.error("Add Room Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getOwnerHostels = async (req, res) => {
  const ownerId = req.userId;

  try {
    const hostels = await prisma.hostel.findMany({
      where: { ownerId },
      include: {
        facilities: true,
        images: true
      }
    });

    return res.status(200).json(hostels);
  } catch (error) {
    console.error("Get Owner Hostels Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
