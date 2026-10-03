package com.hostelhub.service;

import com.hostelhub.dto.BookingRequest;
import com.hostelhub.dto.CheckoutDateRequest;
import com.hostelhub.entity.Booking;
import com.hostelhub.entity.Invoice;
import com.hostelhub.entity.Room;
import com.hostelhub.entity.User;
import com.hostelhub.enums.BookingStatus;
import com.hostelhub.enums.InvoiceStatus;
import com.hostelhub.enums.Role;
import com.hostelhub.enums.RoomStatus;
import com.hostelhub.repository.BookingRepository;
import com.hostelhub.repository.InvoiceRepository;
import com.hostelhub.repository.RoomRepository;
import com.hostelhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    public Booking createBooking(Integer studentId, BookingRequest request) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

        if (student.getRole() != Role.STUDENT && student.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only students can create bookings");
        }

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));

        if (room.getStatus() != RoomStatus.AVAILABLE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room is not available for booking");
        }

        Booking booking = new Booking();
        booking.setStudent(student);
        booking.setRoom(room);
        booking.setStartDate(request.getStartDate());
        booking.setEndDate(request.getEndDate());
        booking.setStatus(BookingStatus.PENDING);

        return bookingRepository.save(booking);
    }

    public List<Booking> getStudentBookings(Integer studentId) {
        return bookingRepository.findByStudentId(studentId);
    }

    public List<Booking> getOwnerBookings(Integer ownerId) {
        return bookingRepository.findByRoomHostelOwnerId(ownerId);
    }

    public Booking updateBookingStatus(Integer ownerId, Integer bookingId, BookingStatus newStatus) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (!booking.getRoom().getHostel().getOwner().getId().equals(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this hostel listing");
        }

        booking.setStatus(newStatus);
        Booking updatedBooking = bookingRepository.save(booking);

        if (newStatus == BookingStatus.ACCEPTED) {
            // 1. Mark room status OCCUPIED
            Room room = booking.getRoom();
            room.setStatus(RoomStatus.OCCUPIED);
            roomRepository.save(room);

            // 2. Generate Security Deposit Invoice (1 Month Rent)
            Invoice invoice = new Invoice();
            invoice.setBooking(updatedBooking);
            invoice.setAmount(room.getPricePerMonth());
            invoice.setDueDate(LocalDateTime.now().plusDays(7));
            invoice.setStatus(InvoiceStatus.PENDING);
            String monthName = LocalDateTime.now().getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
            invoice.setBillingMonth(monthName + " " + LocalDateTime.now().getYear() + " (Security Deposit & 1st Month)");

            invoiceRepository.save(invoice);
        } else if (newStatus == BookingStatus.CANCELLED || newStatus == BookingStatus.REJECTED) {
            Room room = booking.getRoom();
            room.setStatus(RoomStatus.AVAILABLE);
            roomRepository.save(room);
        }

        return updatedBooking;
    }

    public Booking terminateBooking(Integer ownerId, Integer bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (!booking.getRoom().getHostel().getOwner().getId().equals(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this hostel listing");
        }

        booking.setStatus(BookingStatus.CANCELLED);

        Room room = booking.getRoom();
        room.setStatus(RoomStatus.AVAILABLE);
        roomRepository.save(room);

        return bookingRepository.save(booking);
    }

    public Booking changeCheckoutDate(Integer studentId, Integer bookingId, CheckoutDateRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (!booking.getStudent().getId().equals(studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this booking");
        }

        booking.setEndDate(request.getEndDate());
        return bookingRepository.save(booking);
    }
}
