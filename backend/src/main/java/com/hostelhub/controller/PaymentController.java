package com.hostelhub.controller;

import com.hostelhub.dto.PaymentRequest;
import com.hostelhub.entity.Payment;
import com.hostelhub.security.CustomUserDetails;
import com.hostelhub.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping
    public ResponseEntity<Payment> processPayment(@AuthenticationPrincipal CustomUserDetails currentUser,
                                                   @Valid @RequestBody PaymentRequest request) {
        Payment payment = paymentService.processPayment(currentUser.getId(), request);
        return new ResponseEntity<>(payment, HttpStatus.CREATED);
    }

    @GetMapping("/student")
    public ResponseEntity<List<Payment>> getStudentPayments(@AuthenticationPrincipal CustomUserDetails currentUser) {
        List<Payment> payments = paymentService.getStudentPayments(currentUser.getId());
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/owner")
    public ResponseEntity<List<Payment>> getOwnerPayments(@AuthenticationPrincipal CustomUserDetails currentUser) {
        List<Payment> payments = paymentService.getOwnerPayments(currentUser.getId());
        return ResponseEntity.ok(payments);
    }
}
