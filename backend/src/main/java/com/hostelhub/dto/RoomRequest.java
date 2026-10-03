package com.hostelhub.dto;

import com.hostelhub.enums.RoomStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class RoomRequest {

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    @NotBlank(message = "Room type is required")
    private String roomType;

    @NotNull(message = "Capacity is required")
    private Integer capacity;

    @NotNull(message = "Price per month is required")
    private BigDecimal pricePerMonth;

    private RoomStatus status = RoomStatus.AVAILABLE;
    private String imageUrl;
}
