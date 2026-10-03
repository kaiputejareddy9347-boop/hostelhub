package com.hostelhub.dto;

import com.hostelhub.enums.OccupantType;
import com.hostelhub.enums.PropertyType;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class HostelRequest {

    @NotBlank(message = "Property name is required")
    private String name;

    private String description;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    private String city;

    private String contactNumber;
    private String upiId;
    private String bankAccount;

    private PropertyType type = PropertyType.HOSTEL;
    private OccupantType allowedOccupants = OccupantType.ANY;

    private String messTimetable;
    private String googleMapsUrl;

    private List<Integer> facilityIds;
    private List<String> imageUrls;
}
