package com.marinarodriiphoto.backend.config.admin;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpMethod;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

final class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final int ATTEMPTS_PER_ADDRESS = 8;
    private static final int ATTEMPTS_PER_SERVER = 80;
    private static final Duration WINDOW = Duration.ofMinutes(1);
    private final RequestMatcher login = PathPatternRequestMatcher.withDefaults()
            .matcher(HttpMethod.POST, AdminSecurityConfiguration.LOGIN);
    private final Map<String, Integer> attempts = new HashMap<>();
    private long windowStarted = System.nanoTime();
    private int serverAttempts;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !login.matches(request);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long retryAfter = retryAfterSeconds(request.getRemoteAddr());
        if (retryAfter > 0) {
            response.setHeader("Retry-After", Long.toString(retryAfter));
            response.setStatus(429);
            return;
        }
        String password = request.getParameter("password");
        if (password != null && password.getBytes(StandardCharsets.UTF_8).length > 72) {
            response.setStatus(401);
            return;
        }
        chain.doFilter(request, response);
    }

    private synchronized long retryAfterSeconds(String address) {
        long now = System.nanoTime();
        long elapsed = now - windowStarted;
        if (elapsed >= WINDOW.toNanos()) {
            attempts.clear();
            serverAttempts = 0;
            windowStarted = now;
            elapsed = 0;
        }

        int addressAttempts = attempts.getOrDefault(address, 0);
        if (addressAttempts >= ATTEMPTS_PER_ADDRESS || serverAttempts >= ATTEMPTS_PER_SERVER) {
            return WINDOW.minusNanos(elapsed).toSeconds() + 1;
        }

        attempts.put(address, addressAttempts + 1);
        serverAttempts++;
        return 0;
    }
}
