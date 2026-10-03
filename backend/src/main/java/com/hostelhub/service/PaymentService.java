package com.hostelhub.service;

import com.hostelhub.dto.PaymentRequest;
import com.hostelhub.entity.Booking;
import com.hostelhub.entity.Invoice;
import com.hostelhub.entity.Payment;
import com.hostelhub.enums.InvoiceStatus;
import com.hostelhub.enums.PaymentStatus;
import com.hostelhub.repository.InvoiceRepository;
import com.hostelhub.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    public Payment processPayment(Integer userId, PaymentRequest request) {
        Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found"));

        Booking booking = invoice.getBooking();
        boolean isStudent = booking.getStudent().getId().equals(userId);
        boolean isOwner = booking.getRoom().getHostel().getOwner().getId().equals(userId);

        if (!isStudent && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to process payments for this invoice");
        }

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invoice is already paid");
        }

        String paymentMethod = request.getPaymentMethod();
        String txnId = request.getTransactionId();
        String screenshot = request.getScreenshot();

        if (!"CASH".equalsIgnoreCase(paymentMethod) 
                && !StringUtils.hasText(txnId) 
                && !StringUtils.hasText(screenshot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Either Transaction ID or payment screenshot is required.");
        }

        // Mark invoice paid
        invoice.setStatus(InvoiceStatus.PAID);
        invoiceRepository.save(invoice);

        // Generate transaction ID if missing
        String finalTxnId = txnId;
        if (!StringUtils.hasText(finalTxnId)) {
            if ("CASH".equalsIgnoreCase(paymentMethod)) {
                finalTxnId = "TXN-CASH-" + System.currentTimeMillis();
            } else {
                finalTxnId = "TXN-PENDING-" + System.currentTimeMillis();
            }
        }

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setInvoice(invoice);
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(paymentMethod);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setTransactionId(finalTxnId);
        payment.setScreenshot(screenshot);

        return paymentRepository.save(payment);
    }

    public List<Payment> getStudentPayments(Integer studentId) {
        return paymentRepository.findByBookingStudentId(studentId);
    }

    public List<Payment> getOwnerPayments(Integer ownerId) {
        return paymentRepository.findByBookingRoomHostelOwnerId(ownerId);
    }
}
