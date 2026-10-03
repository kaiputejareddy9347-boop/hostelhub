package com.hostelhub.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ComplaintReplyRequest {
    @NotBlank(message = "Reply is required")
    private String ownerReply;
}
