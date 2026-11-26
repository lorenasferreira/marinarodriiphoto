package com.marinarodriiphoto.backend.config.admin;

import java.security.Principal;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(AdminSecurityConfiguration.BASE)
class AdminSessionController {

    @GetMapping("/csrf")
    CsrfResponse csrf(CsrfToken csrf) {
        return new CsrfResponse(csrf.getHeaderName(), csrf.getToken());
    }

    @GetMapping("/session")
    SessionResponse session(Principal principal) {
        return new SessionResponse(principal.getName());
    }

    record CsrfResponse(String headerName, String token) {}
    record SessionResponse(String email) {}
}
