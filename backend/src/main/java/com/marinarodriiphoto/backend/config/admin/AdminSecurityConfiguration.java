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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.CookieClearingLogoutHandler;

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
                .build();
    }

    private static void problem(HttpServletResponse response, int status, String title) throws IOException {
        response.setStatus(status);
        response.setContentType("application/problem+json");
        response.getWriter().write("""
                {"type":"about:blank","status":%d,"title":"%s"}
                """.formatted(status, title));
    }
}
