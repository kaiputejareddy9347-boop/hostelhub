package com.hostelhub.controller;

import com.hostelhub.dto.ComplaintReplyRequest;
import com.hostelhub.dto.ComplaintRequest;
import com.hostelhub.entity.Complaint;
import com.hostelhub.security.CustomUserDetails;
import com.hostelhub.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    @PostMapping
    public ResponseEntity<Complaint> createComplaint(@AuthenticationPrincipal CustomUserDetails currentUser,
                                                     @Valid @RequestBody ComplaintRequest request) {
        Complaint complaint = complaintService.createComplaint(currentUser.getId(), request);
        return new ResponseEntity<>(complaint, HttpStatus.CREATED);
    }

    @GetMapping("/student")
    public ResponseEntity<List<Complaint>> getStudentComplaints(@AuthenticationPrincipal CustomUserDetails currentUser) {
        List<Complaint> complaints = complaintService.getStudentComplaints(currentUser.getId());
        return ResponseEntity.ok(complaints);
    }

    @GetMapping("/owner")
    public ResponseEntity<List<Complaint>> getOwnerComplaints(@AuthenticationPrincipal CustomUserDetails currentUser) {
        List<Complaint> complaints = complaintService.getOwnerComplaints(currentUser.getId());
        return ResponseEntity.ok(complaints);
    }

    @PutMapping("/{id}/reply")
    public ResponseEntity<Complaint> replyToComplaint(@AuthenticationPrincipal CustomUserDetails currentUser,
                                                       @PathVariable Integer id,
                                                       @Valid @RequestBody ComplaintReplyRequest request) {
        Complaint complaint = complaintService.replyToComplaint(currentUser.getId(), id, request);
        return ResponseEntity.ok(complaint);
    }
}
