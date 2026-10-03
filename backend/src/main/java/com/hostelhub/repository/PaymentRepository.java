package com.hostelhub.repository;

import com.hostelhub.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    List<Payment> findByBookingStudentId(Integer studentId);
    List<Payment> findByBookingRoomHostelOwnerId(Integer ownerId);
    Optional<Payment> findByTransactionId(String transactionId);
}
