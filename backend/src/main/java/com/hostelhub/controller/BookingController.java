package com.hostelhub.controller;

import com.hostelhub.config.UserDetailsImpl;
import com.hostelhub.dto.BookingRequest;
import com.hostelhub.dto.BookingStatusRequest;
import com.hostelhub.entity.*;
import com.hostelhub.repository.BookingRepository;
import com.hostelhub.repository.RoomRepository;
import com.hostelhub.repository.UserRepository;
import com.hostelhub.repository.InvoiceRepository;
import java.time.LocalDate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> createBooking(@RequestBody BookingRequest bookingRequest) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User student = userRepository.findById(userPrincipal.getId()).orElse(null);

        if (student == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Student not found");
        }

        Optional<Room> roomData = roomRepository.findById(bookingRequest.getRoomId());
        if (roomData.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Room not found");
        }

        Room room = roomData.get();
        if (room.getStatus() != RoomStatus.AVAILABLE) {
            return ResponseEntity.badRequest().body("Room is not available for booking");
        }

        Booking booking = new Booking(student, 
                                      room, 
                                      bookingRequest.getStartDate(), 
                                      bookingRequest.getEndDate());

        Booking savedBooking = bookingRepository.save(booking);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedBooking);
    }

    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<Booking>> getStudentBookings() {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<Booking> bookings = bookingRepository.findByStudentId(userPrincipal.getId());
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/owner")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<Booking>> getOwnerBookings() {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<Booking> bookings = bookingRepository.findByOwnerId(userPrincipal.getId());
        return ResponseEntity.ok(bookings);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> updateBookingStatus(@PathVariable Long id, @RequestBody BookingStatusRequest statusRequest) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Optional<Booking> bookingData = bookingRepository.findById(id);

        if (bookingData.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Booking not found");
        }

        Booking booking = bookingData.get();
        // Check ownership of the hostel containing the room
        if (!booking.getRoom().getHostel().getOwner().getId().equals(userPrincipal.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You do not own this hostel listing");
        }

        booking.setStatus(statusRequest.getStatus());

        // Business logic: if accepted, we can mark the room occupied and generate monthly invoices
        if (statusRequest.getStatus() == BookingStatus.ACCEPTED) {
            Room room = booking.getRoom();
            room.setStatus(RoomStatus.OCCUPIED);
            roomRepository.save(room);

            // 1. Generate Security Deposit (Advance) Invoice (1 Month Rent)
            Invoice securityDeposit = new Invoice(
                booking,
                booking.getRoom().getPricePerMonth(),
                booking.getStartDate(),
                InvoiceStatus.PENDING,
                "Security Deposit (Advance)"
            );
            invoiceRepository.save(securityDeposit);

            // 2. Pre-generate monthly invoices for the booking duration
            LocalDate current = booking.getStartDate();
            LocalDate end = booking.getEndDate();
            while (current.isBefore(end) || (current.getMonthValue() == end.getMonthValue() && current.getYear() == end.getYear())) {
                LocalDate dueDate = current.withDayOfMonth(1);
                if (dueDate.isBefore(booking.getStartDate())) {
                    dueDate = booking.getStartDate();
                }
                
                String billingMonth = current.getMonth().name() + " " + current.getYear();
                Invoice invoice = new Invoice(booking, 
                                              booking.getRoom().getPricePerMonth(), 
                                              dueDate, 
                                              InvoiceStatus.PENDING, 
                                              billingMonth);
                invoiceRepository.save(invoice);
                
                // Advance to next month
                current = current.plusMonths(1).withDayOfMonth(1);
            }
        } else if (statusRequest.getStatus() == BookingStatus.CANCELLED || statusRequest.getStatus() == BookingStatus.REJECTED) {
            Room room = booking.getRoom();
            // Optional: reset room status if needed, but only if it's currently occupied
            if (room.getStatus() == RoomStatus.OCCUPIED) {
                room.setStatus(RoomStatus.AVAILABLE);
                roomRepository.save(room);
            }
        }

        Booking updatedBooking = bookingRepository.save(booking);
        return ResponseEntity.ok(updatedBooking);
    }

    @PutMapping("/{id}/terminate")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> terminateBooking(@PathVariable Long id) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Optional<Booking> bookingData = bookingRepository.findById(id);

        if (bookingData.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Booking not found");
        }

        Booking booking = bookingData.get();
        if (!booking.getRoom().getHostel().getOwner().getId().equals(userPrincipal.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You do not own this hostel listing");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);

        Room room = booking.getRoom();
        room.setStatus(RoomStatus.AVAILABLE);
        roomRepository.save(room);

        // Delete outstanding pending invoices
        List<Invoice> invoices = invoiceRepository.findAll().stream()
            .filter(inv -> inv.getBooking().getId().equals(booking.getId()))
            .collect(Collectors.toList());
        for (Invoice inv : invoices) {
            if (inv.getStatus() == InvoiceStatus.PENDING) {
                invoiceRepository.delete(inv);
            }
        }

        return ResponseEntity.ok().body("Booking terminated and room released successfully.");
    }

    @PutMapping("/{id}/checkout-date")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> changeCheckoutDate(@PathVariable Long id, @RequestBody java.util.Map<String, String> payload) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Optional<Booking> bookingData = bookingRepository.findById(id);

        if (bookingData.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Booking not found");
        }

        Booking booking = bookingData.get();
        if (!booking.getStudent().getId().equals(userPrincipal.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You do not own this booking");
        }

        String endDateStr = payload.get("endDate");
        if (endDateStr == null) {
            return ResponseEntity.badRequest().body("endDate is required");
        }

        LocalDate newEndDate = LocalDate.parse(endDateStr);
        if (newEndDate.isBefore(booking.getStartDate())) {
            return ResponseEntity.badRequest().body("Checkout date cannot be before check-in date");
        }

        booking.setEndDate(newEndDate);
        bookingRepository.save(booking);

        // Recalculate Invoices
        List<Invoice> existing = invoiceRepository.findAll().stream()
            .filter(inv -> inv.getBooking().getId().equals(booking.getId()))
            .collect(Collectors.toList());

        Set<String> paidMonths = existing.stream()
            .filter(inv -> inv.getStatus() == InvoiceStatus.PAID)
            .map(Invoice::getBillingMonth)
            .collect(Collectors.toSet());

        // Delete pending monthly invoices
        for (Invoice inv : existing) {
            if (inv.getStatus() == InvoiceStatus.PENDING && !inv.getBillingMonth().equals("Security Deposit (Advance)")) {
                invoiceRepository.delete(inv);
            }
        }

        // Re-generate monthly invoices up to the new endDate
        LocalDate current = booking.getStartDate();
        LocalDate end = booking.getEndDate();
        while (current.isBefore(end) || (current.getMonthValue() == end.getMonthValue() && current.getYear() == end.getYear())) {
            String billingMonth = current.getMonth().name() + " " + current.getYear();
            if (!paidMonths.contains(billingMonth)) {
                LocalDate dueDate = current.withDayOfMonth(1);
                if (dueDate.isBefore(booking.getStartDate())) {
                    dueDate = booking.getStartDate();
                }
                Invoice invoice = new Invoice(booking, 
                                              booking.getRoom().getPricePerMonth(), 
                                              dueDate, 
                                              InvoiceStatus.PENDING, 
                                              billingMonth);
                invoiceRepository.save(invoice);
            }
            current = current.plusMonths(1).withDayOfMonth(1);
        }

        return ResponseEntity.ok(booking);
    }
}
