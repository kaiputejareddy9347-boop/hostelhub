package com.hostelhub.controller;

import com.hostelhub.entity.Invoice;
import com.hostelhub.security.CustomUserDetails;
import com.hostelhub.service.InvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    @Autowired
    private InvoiceService invoiceService;

    @GetMapping("/student")
    public ResponseEntity<List<Invoice>> getStudentInvoices(@AuthenticationPrincipal CustomUserDetails currentUser) {
        List<Invoice> invoices = invoiceService.getStudentInvoices(currentUser.getId());
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/owner")
    public ResponseEntity<List<Invoice>> getOwnerInvoices(@AuthenticationPrincipal CustomUserDetails currentUser) {
        List<Invoice> invoices = invoiceService.getOwnerInvoices(currentUser.getId());
        return ResponseEntity.ok(invoices);
    }
}
