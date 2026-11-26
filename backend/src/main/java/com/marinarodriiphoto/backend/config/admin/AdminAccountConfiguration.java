package com.marinarodriiphoto.backend.config.admin;

import java.util.Locale;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcOperations;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration(proxyBeanMethods = false)
class AdminAccountConfiguration {

    @Bean
    PasswordEncoder adminPasswordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    UserDetailsService adminAccounts(JdbcOperations jdbc) {
        return email -> jdbc.query("""
                SELECT email, password_hash
                FROM admin_accounts
                WHERE email = ? AND enabled = TRUE
                """, (row, index) -> User.withUsername(row.getString("email"))
                    .password(row.getString("password_hash"))
                    .roles("PORTFOLIO_ADMIN")
                    .build(), email.strip().toLowerCase(Locale.ROOT))
                .stream()
                .findFirst()
                .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
    }
}
