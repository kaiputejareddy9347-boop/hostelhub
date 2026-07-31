package com.hostelhub.controller;

import com.hostelhub.config.UserDetailsImpl;
import com.hostelhub.dto.HostelRequest;
import com.hostelhub.dto.RoomRequest;
import com.hostelhub.entity.*;
import com.hostelhub.repository.FacilityRepository;
import com.hostelhub.repository.HostelRepository;
import com.hostelhub.repository.RoomRepository;
import com.hostelhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/hostels")
public class HostelController {

    @Autowired
    private HostelRepository hostelRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FacilityRepository facilityRepository;

    @GetMapping
    public ResponseEntity<List<Hostel>> getAllHostels(@RequestParam(required = false) String city) {
        List<Hostel> hostels;
        if (city != null && !city.trim().isEmpty()) {
            hostels = hostelRepository.findByCityContainingIgnoreCase(city);
        } else {
            hostels = hostelRepository.findAll();
        }
        return ResponseEntity.ok(hostels);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getHostelById(@PathVariable Long id) {
        Optional<Hostel> hostelData = hostelRepository.findById(id);
        if (hostelData.isPresent()) {
            Hostel hostel = hostelData.get();
            List<Room> rooms = roomRepository.findByHostelId(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("hostel", hostel);
            response.put("rooms", rooms);
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Hostel not found");
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER') or hasRole('ADMIN')")
    public ResponseEntity<?> createHostel(@RequestBody HostelRequest hostelRequest) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User owner = userRepository.findById(userPrincipal.getId()).orElse(null);
        
        if (owner == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Owner not found");
        }

        Hostel hostel = new Hostel(owner, 
                                   hostelRequest.getName(), 
                                   hostelRequest.getDescription(), 
                                   hostelRequest.getAddress(), 
                                   hostelRequest.getCity(), 
                                   hostelRequest.getContactNumber());

        hostel.setUpiId(hostelRequest.getUpiId());
        hostel.setBankAccount(hostelRequest.getBankAccount());

        if (hostelRequest.getFacilityIds() != null) {
            Set<Facility> facilities = new HashSet<>();
            for (Long facilityId : hostelRequest.getFacilityIds()) {
                facilityRepository.findById(facilityId).ifPresent(facilities::add);
            }
            hostel.setFacilities(facilities);
        }

        if (hostelRequest.getImageUrls() != null) {
            List<Image> images = new ArrayList<>();
            for (String url : hostelRequest.getImageUrls()) {
                if (url != null && !url.trim().isEmpty()) {
                    images.add(new Image(hostel, url.trim()));
                }
            }
            hostel.setImages(images);
        }

        Hostel savedHostel = hostelRepository.save(hostel);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedHostel);
    }

    @PostMapping("/{id}/rooms")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> addRoomToHostel(@PathVariable Long id, @RequestBody RoomRequest roomRequest) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Optional<Hostel> hostelData = hostelRepository.findById(id);
        
        if (hostelData.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Hostel not found");
        }

        Hostel hostel = hostelData.get();
        if (!hostel.getOwner().getId().equals(userPrincipal.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You do not own this hostel");
        }

        Room room = new Room(hostel, 
                             roomRequest.getRoomNumber(), 
                             roomRequest.getRoomType(), 
                             roomRequest.getCapacity(), 
                             roomRequest.getPricePerMonth());

        Room savedRoom = roomRepository.save(room);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedRoom);
    }

    @GetMapping("/owner")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> getOwnerHostels() {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<Hostel> hostels = hostelRepository.findByOwnerId(userPrincipal.getId());
        return ResponseEntity.ok(hostels);
    }
}
