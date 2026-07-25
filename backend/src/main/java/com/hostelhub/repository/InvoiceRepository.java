package com.hostelhub.repository;

import com.hostelhub.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByBookingStudentId(Long studentId);

    @Query("SELECT i FROM Invoice i WHERE i.booking.room.hostel.owner.id = :ownerId")
    List<Invoice> findByOwnerId(@Param("ownerId") Long ownerId);
}
