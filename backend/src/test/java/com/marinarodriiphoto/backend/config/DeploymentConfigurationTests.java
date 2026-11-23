package com.marinarodriiphoto.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class DeploymentConfigurationTests {
    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withInitializer(new ConfigDataApplicationContextInitializer())
            .withPropertyValues("spring.config.location=classpath:/");

    @Test
    void productionUsesRailwayVariablesAndIgnoresLocalCookieAndFlywaySwitches() {
        runner.withPropertyValues(
                "spring.profiles.active=production",
                "PORT=18080",
                "DB_URL=jdbc:mysql://mysql.railway.internal:3306/railway",
                "DB_USERNAME=portfolio_test",
                "DEV_DB_URL=jdbc:mysql://127.0.0.1:8889/marinarodriiphoto_dev",
                "DEV_FLYWAY_ENABLED=true",
                "ADMIN_SESSION_COOKIE_SECURE=false"
        ).run(context -> {
            var env = context.getEnvironment();
            assertThat(env.getProperty("server.port")).isEqualTo("18080");
            assertThat(env.getProperty("spring.datasource.url")).isEqualTo("jdbc:mysql://mysql.railway.internal:3306/railway");
            assertThat(env.getProperty("spring.datasource.username")).isEqualTo("portfolio_test");
            assertThat(env.getProperty("spring.flyway.enabled")).isEqualTo("false");
            assertThat(env.getProperty("spring.flyway.clean-disabled")).isEqualTo("true");
            assertThat(env.getProperty("spring.flyway.create-schemas")).isEqualTo("false");
            assertThat(env.getProperty("spring.flyway.baseline-on-migrate")).isEqualTo("false");
            assertThat(env.getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
            assertThat(env.getProperty("server.servlet.session.cookie.secure")).isEqualTo("true");
            assertThat(env.getProperty("server.forward-headers-strategy")).isEqualTo("none");
            assertThat(env.getProperty("spring.web.error.include-message")).isEqualTo("never");
            assertThat(env.getPropertySources().stream().noneMatch(source -> source.getName().contains(".env"))).isTrue();
        });
    }

    @Test
    void localConfigurationKeepsMampAndAllowsTheLoopbackCookieOverride() {
        runner.withPropertyValues(
                "spring.profiles.active=local-test",
                "DEV_DB_URL=jdbc:mysql://127.0.0.1:8889/marinarodriiphoto_dev",
                "ADMIN_SESSION_COOKIE_SECURE=false",
                "DEV_FLYWAY_ENABLED=false"
        ).run(context -> {
            var env = context.getEnvironment();
            assertThat(env.getProperty("spring.datasource.url")).endsWith(":8889/marinarodriiphoto_dev");
            assertThat(env.getProperty("server.servlet.session.cookie.secure")).isEqualTo("false");
            assertThat(env.getProperty("spring.flyway.enabled")).isEqualTo("false");
        });
    }
}
