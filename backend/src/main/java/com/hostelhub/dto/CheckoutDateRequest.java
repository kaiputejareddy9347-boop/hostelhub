package com.hostelhub.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CheckoutDateRequest {
    @NotNull(message = "End date is required")
    private LocalDateTime endDate;
}
