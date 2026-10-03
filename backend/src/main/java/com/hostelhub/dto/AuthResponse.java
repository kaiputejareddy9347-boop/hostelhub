package com.hostelhub.dto;

import com.hostelhub.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Integer id;
    private String username;
    private String email;
    private Role role;
    private String name;
}
