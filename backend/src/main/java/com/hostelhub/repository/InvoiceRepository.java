package com.hostelhub.repository;

import com.hostelhub.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Integer> {
    List<Invoice> findByBookingStudentId(Integer studentId);
    List<Invoice> findByBookingRoomHostelOwnerId(Integer ownerId);
}
