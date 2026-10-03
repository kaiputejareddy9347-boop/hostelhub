package com.hostelhub.controller;

import com.hostelhub.dto.BookingRequest;
import com.hostelhub.dto.CheckoutDateRequest;
import com.hostelhub.dto.StatusUpdateRequest;
import com.hostelhub.entity.Booking;
import com.hostelhub.security.CustomUserDetails;
import com.hostelhub.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping
    public ResponseEntity<Booking> createBooking(@AuthenticationPrincipal CustomUserDetails currentUser,
                                                  @Valid @RequestBody BookingRequest request) {
        Booking booking = bookingService.createBooking(currentUser.getId(), request);
        return new ResponseEntity<>(booking, HttpStatus.CREATED);
    }

    @GetMapping("/student")
    public ResponseEntity<List<Booking>> getStudentBookings(@AuthenticationPrincipal CustomUserDetails currentUser) {
        List<Booking> bookings = bookingService.getStudentBookings(currentUser.getId());
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/owner")
    public ResponseEntity<List<Booking>> getOwnerBookings(@AuthenticationPrincipal CustomUserDetails currentUser) {
        List<Booking> bookings = bookingService.getOwnerBookings(currentUser.getId());
        return ResponseEntity.ok(bookings);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Booking> updateStatus(@AuthenticationPrincipal CustomUserDetails currentUser,
                                                 @PathVariable Integer id,
                                                 @Valid @RequestBody StatusUpdateRequest request) {
        Booking booking = bookingService.updateBookingStatus(currentUser.getId(), id, request.getStatus());
        return ResponseEntity.ok(booking);
    }

    @PutMapping("/{id}/terminate")
    public ResponseEntity<Booking> terminateBooking(@AuthenticationPrincipal CustomUserDetails currentUser,
                                                     @PathVariable Integer id) {
        Booking booking = bookingService.terminateBooking(currentUser.getId(), id);
        return ResponseEntity.ok(booking);
    }

    @PutMapping("/{id}/checkout-date")
    public ResponseEntity<Booking> changeCheckoutDate(@AuthenticationPrincipal CustomUserDetails currentUser,
                                                       @PathVariable Integer id,
                                                       @Valid @RequestBody CheckoutDateRequest request) {
        Booking booking = bookingService.changeCheckoutDate(currentUser.getId(), id, request);
        return ResponseEntity.ok(booking);
    }
}
