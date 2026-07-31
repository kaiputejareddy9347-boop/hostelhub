import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// BigInt Serialization Patch (in case any Prisma query returns BigInt values)
BigInt.prototype.toJSON = function() {
  const num = Number(this);
  return Number.isSafeInteger(num) ? num : this.toString();
};

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Controllers and Middleware Imports
import { verifyToken, isStudent, isOwner, isOwnerOrAdmin } from './middleware/auth.js';
import * as authController from './controllers/auth.controller.js';
import * as hostelController from './controllers/hostel.controller.js';
import * as bookingController from './controllers/booking.controller.js';
import * as paymentController from './controllers/payment.controller.js';
import * as complaintController from './controllers/complaint.controller.js';
import * as facilityController from './controllers/facility.controller.js';
import * as invoiceController from './controllers/invoice.controller.js';

// Route declarations

// 1. Auth routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

// 2. Hostel & Room routes
app.get('/api/hostels', hostelController.getAllHostels);
app.get('/api/hostels/owner', verifyToken, isOwner, hostelController.getOwnerHostels);
app.get('/api/hostels/:id', hostelController.getHostelById);
app.post('/api/hostels', verifyToken, isOwnerOrAdmin, hostelController.createHostel);
app.post('/api/hostels/:id/rooms', verifyToken, isOwner, hostelController.addRoomToHostel);

// 3. Booking routes
app.post('/api/bookings', verifyToken, isStudent, bookingController.createBooking);
app.get('/api/bookings/student', verifyToken, isStudent, bookingController.getStudentBookings);
app.get('/api/bookings/owner', verifyToken, isOwner, bookingController.getOwnerBookings);
app.put('/api/bookings/:id/status', verifyToken, isOwner, bookingController.updateBookingStatus);
app.put('/api/bookings/:id/terminate', verifyToken, isOwner, bookingController.terminateBooking);
app.put('/api/bookings/:id/checkout-date', verifyToken, isStudent, bookingController.changeCheckoutDate);

// 4. Invoices routes
app.get('/api/invoices/student', verifyToken, isStudent, invoiceController.getStudentInvoices);
app.get('/api/invoices/owner', verifyToken, isOwner, invoiceController.getOwnerInvoices);

// 5. Payment routes
app.post('/api/payments', verifyToken, paymentController.processPayment);
app.get('/api/payments/student', verifyToken, isStudent, paymentController.getStudentPayments);
app.get('/api/payments/owner', verifyToken, isOwner, paymentController.getOwnerPayments);

// 6. Complaint routes
app.post('/api/complaints', verifyToken, isStudent, complaintController.raiseComplaint);
app.get('/api/complaints/student', verifyToken, isStudent, complaintController.getStudentComplaints);
app.get('/api/complaints/owner', verifyToken, isOwner, complaintController.getOwnerComplaints);
app.put('/api/complaints/:id/reply', verifyToken, isOwner, complaintController.replyToComplaint);

// 7. Facility routes
app.get('/api/facilities', facilityController.getAllFacilities);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date() });
});

// For Vercel Serverless deployment, we export app.
// For local execution, we listen on the configured port.
const PORT = process.env.PORT || 8080;
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
}

export default app;
