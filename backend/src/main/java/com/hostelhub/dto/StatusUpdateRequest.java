package com.hostelhub.dto;

import com.hostelhub.enums.BookingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StatusUpdateRequest {
    @NotNull(message = "Status is required")
    private BookingStatus status;
}
