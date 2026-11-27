package com.marinarodriiphoto.backend.config.admin;

import java.io.IOException;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.CookieClearingLogoutHandler;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;

@Configuration(proxyBeanMethods = false)
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@EnableWebSecurity
class AdminSecurityConfiguration {

    static final String BASE = "/api/admin";
    static final String LOGIN = BASE + "/login";

    @Bean
    SecurityFilterChain adminSecurity(HttpSecurity http, UserDetailsService accounts, PasswordEncoder encoder,
            @Value("${server.servlet.session.cookie.secure:true}") boolean secureCookie) throws Exception {
        var provider = new DaoAuthenticationProvider(accounts);
        provider.setPasswordEncoder(encoder);
        var expiredSession = new Cookie("JSESSIONID", "");
        expiredSession.setPath("/");
        expiredSession.setMaxAge(0);
        expiredSession.setHttpOnly(true);
        expiredSession.setSecure(secureCookie);
        expiredSession.setAttribute("SameSite", "Lax");

        return http.authenticationProvider(provider)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/api/public/portfolio",
                                "/api/public/portfolio/{id}/media/{variant}").permitAll()
                        .requestMatchers(HttpMethod.GET, BASE + "/csrf").permitAll()
                        .requestMatchers(HttpMethod.POST, LOGIN).permitAll()
                        .requestMatchers(HttpMethod.GET, BASE + "/session")
                            .hasAnyRole("PORTFOLIO_ADMIN", "PASSWORD_CHANGE_REQUIRED")
                        .requestMatchers(HttpMethod.POST, BASE + "/password")
                            .hasAnyRole("PORTFOLIO_ADMIN", "PASSWORD_CHANGE_REQUIRED")
                        .requestMatchers(BASE + "/**").hasRole("PORTFOLIO_ADMIN")
                        .anyRequest().denyAll())
                .csrf(Customizer.withDefaults())
                .requestCache(AbstractHttpConfigurer::disable)
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, failure) -> problem(response, 401, "Unauthorized"))
                        .accessDeniedHandler((request, response, failure) -> problem(response, 403, "Forbidden")))
                .sessionManagement(session -> session.sessionFixation(fixation -> fixation.changeSessionId()))
                .formLogin(form -> form
                        .loginProcessingUrl(LOGIN)
                        .usernameParameter("email")
                        .successHandler((request, response, authentication) -> response.setStatus(204))
                        .failureHandler((request, response, failure) -> response.setStatus(401)))
                .logout(logout -> logout
                        .logoutUrl(BASE + "/logout")
                        .addLogoutHandler(new CookieClearingLogoutHandler(expiredSession))
                        .logoutSuccessHandler((request, response, authentication) -> response.setStatus(204)))
                .addFilterBefore(new LoginRateLimitFilter(), UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(new OncePerRequestFilter() {
                    private final PathPatternRequestMatcher admin = PathPatternRequestMatcher.withDefaults()
                            .matcher(BASE + "/**");

                    @Override
                    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                            FilterChain chain) throws IOException, ServletException {
                        var authentication = SecurityContextHolder.getContext().getAuthentication();
                        if (admin.matches(request) && authentication != null
                                && authentication.getPrincipal() instanceof AdminPrincipal principal
                                && !isCurrent(accounts, principal)) {
                            new SecurityContextLogoutHandler().logout(request, response, authentication);
                            problem(response, 401, "Unauthorized");
                            return;
                        }
                        chain.doFilter(request, response);
                    }
                }, AuthorizationFilter.class)
                .build();
    }

    private static boolean isCurrent(UserDetailsService accounts, AdminPrincipal principal) {
        try {
            var current = (AdminPrincipal) accounts.loadUserByUsername(principal.getUsername());
            return current.credentialVersion() == principal.credentialVersion()
                    && current.passwordChangeRequired() == principal.passwordChangeRequired();
        } catch (UsernameNotFoundException failure) {
            return false;
        }
    }

    private static void problem(HttpServletResponse response, int status, String title) throws IOException {
        response.setStatus(status);
        response.setContentType("application/problem+json");
        response.getWriter().write("""
                {"type":"about:blank","status":%d,"title":"%s"}
                """.formatted(status, title));
    }
}
