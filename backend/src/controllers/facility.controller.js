import prisma from '../db.js';

export const getAllFacilities = async (req, res) => {
  try {
    const facilities = await prisma.facility.findMany();
    return res.status(200).json(facilities);
  } catch (error) {
    console.error("Get All Facilities Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
