package com.hostelhub.controller;

import com.hostelhub.dto.ExpenseRequest;
import com.hostelhub.dto.HostelRequest;
import com.hostelhub.dto.RoomRequest;
import com.hostelhub.entity.Expense;
import com.hostelhub.entity.Hostel;
import com.hostelhub.entity.Room;
import com.hostelhub.security.CustomUserDetails;
import com.hostelhub.service.HostelService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hostels")
public class HostelController {

    @Autowired
    private HostelService hostelService;

    @GetMapping
    public ResponseEntity<List<Hostel>> getAllHostels(@RequestParam(required = false) String city) {
        List<Hostel> hostels = hostelService.getAllHostels(city);
        return ResponseEntity.ok(hostels);
    }

    @GetMapping("/owner")
    public ResponseEntity<List<Hostel>> getOwnerHostels(@AuthenticationPrincipal CustomUserDetails currentUser) {
        List<Hostel> hostels = hostelService.getHostelsByOwner(currentUser.getId());
        return ResponseEntity.ok(hostels);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Hostel> getHostelById(@PathVariable Integer id) {
        Hostel hostel = hostelService.getHostelById(id);
        return ResponseEntity.ok(hostel);
    }

    @PostMapping
    public ResponseEntity<Hostel> createHostel(@AuthenticationPrincipal CustomUserDetails currentUser,
                                                @Valid @RequestBody HostelRequest request) {
        Hostel hostel = hostelService.createHostel(currentUser.getId(), request);
        return new ResponseEntity<>(hostel, HttpStatus.CREATED);
    }

    @PostMapping("/{id}/rooms")
    public ResponseEntity<Room> addRoom(@AuthenticationPrincipal CustomUserDetails currentUser,
                                         @PathVariable Integer id,
                                         @Valid @RequestBody RoomRequest request) {
        Room room = hostelService.addRoomToHostel(currentUser.getId(), id, request);
        return new ResponseEntity<>(room, HttpStatus.CREATED);
    }

    @PostMapping("/{id}/expenses")
    public ResponseEntity<Expense> addExpense(@AuthenticationPrincipal CustomUserDetails currentUser,
                                               @PathVariable Integer id,
                                               @Valid @RequestBody ExpenseRequest request) {
        Expense expense = hostelService.addExpenseToHostel(currentUser.getId(), id, request);
        return new ResponseEntity<>(expense, HttpStatus.CREATED);
    }
}
