package com.hostelhub.controller;

import com.hostelhub.config.UserDetailsImpl;
import com.hostelhub.dto.PaymentRequest;
import com.hostelhub.entity.*;
import com.hostelhub.repository.BookingRepository;
import com.hostelhub.repository.PaymentRepository;
import com.hostelhub.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT') or hasRole('OWNER')")
    public ResponseEntity<?> processPayment(@RequestBody PaymentRequest paymentRequest) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Optional<Invoice> invoiceData = invoiceRepository.findById(paymentRequest.getInvoiceId());

        if (invoiceData.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Invoice not found");
        }

        Invoice invoice = invoiceData.get();
        Booking booking = invoice.getBooking();
        
        boolean isStudent = booking.getStudent().getId().equals(userPrincipal.getId());
        boolean isOwner = booking.getRoom().getHostel().getOwner().getId().equals(userPrincipal.getId());
        
        if (!isStudent && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You do not have permission to process payments for this invoice");
        }

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            return ResponseEntity.badRequest().body("Invoice is already paid");
        }

        // Mark invoice as paid
        invoice.setStatus(InvoiceStatus.PAID);
        invoiceRepository.save(invoice);

        Payment payment = new Payment(booking, 
                                      invoice,
                                      paymentRequest.getAmount(), 
                                      paymentRequest.getPaymentMethod(), 
                                      PaymentStatus.SUCCESS, 
                                      paymentRequest.getTransactionId());

        Payment savedPayment = paymentRepository.save(payment);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedPayment);
    }

    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<Payment>> getStudentPayments() {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<Payment> payments = paymentRepository.findByBookingStudentId(userPrincipal.getId());
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/owner")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<Payment>> getOwnerPayments() {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<Payment> payments = paymentRepository.findByOwnerId(userPrincipal.getId());
        return ResponseEntity.ok(payments);
    }
}
