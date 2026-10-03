package com.hostelhub.service;

import com.hostelhub.entity.Invoice;
import com.hostelhub.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InvoiceService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    public List<Invoice> getStudentInvoices(Integer studentId) {
        return invoiceRepository.findByBookingStudentId(studentId);
    }

    public List<Invoice> getOwnerInvoices(Integer ownerId) {
        return invoiceRepository.findByBookingRoomHostelOwnerId(ownerId);
    }
}
