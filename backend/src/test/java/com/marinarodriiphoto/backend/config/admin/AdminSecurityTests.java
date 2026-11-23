package com.marinarodriiphoto.backend.config.admin;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.SQLException;
import java.sql.Types;
import java.util.List;
import java.util.Map;

import javax.sql.rowset.RowSetMetaDataImpl;
import javax.sql.rowset.RowSetProvider;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcOperations;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestExecutionListeners;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.test.context.support.DependencyInjectionTestExecutionListener;
import org.springframework.test.context.web.ServletTestExecutionListener;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

@SpringJUnitWebConfig(AdminSecurityTests.WebConfig.class)
@TestExecutionListeners({ServletTestExecutionListener.class, DependencyInjectionTestExecutionListener.class})
class AdminSecurityTests {
    private static final String BASE = "/api/admin";
    private static final String FIRST = "marina@example.test";
    private static final String SECOND = "lorena@example.test";
    private static final String FIRST_PASSWORD = "test-marina-password";
    private static final String SECOND_PASSWORD = "test-lorena-password";

    @Autowired
    private WebApplicationContext context;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void bothAccountsAuthenticateIndependentlyAndLoginRotatesSessionId() throws Exception {
        MockHttpSession first = authenticate("  MARINA@example.test  ", FIRST_PASSWORD, "192.0.2.10");
        MockHttpSession second = authenticate(SECOND, SECOND_PASSWORD, "192.0.2.11");
        mvc.perform(get(BASE + "/session").session(first))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value(FIRST));
        mvc.perform(get(BASE + "/session").session(second))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value(SECOND));
    }

    @Test
    void incorrectPasswordAndUnknownAccountReturnSameStatus() throws Exception {
        mvc.perform(login(FIRST, SECOND_PASSWORD, "192.0.2.12").with(csrf()))
                .andExpect(status().isUnauthorized());
        mvc.perform(login("unknown@example.test", SECOND_PASSWORD, "192.0.2.12").with(csrf()))
                .andExpect(status().isUnauthorized());
        mvc.perform(login(FIRST, "é".repeat(37), "192.0.2.12").with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void blocksAnonymousAndWrongRoleAndKeepsLegacyWritesDisabled() throws Exception {
        mvc.perform(get(BASE + "/session")).andExpect(status().isUnauthorized());
        mvc.perform(post(BASE + "/photos").with(csrf())).andExpect(status().isUnauthorized());
        mvc.perform(post(BASE + "/photos").with(user("viewer").roles("VIEWER")).with(csrf()))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/projects").with(user(FIRST).roles("PORTFOLIO_ADMIN")).with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void portfolioReadsAndBothWriteRoutesRequireAuthorizationAndWritesRequireCsrf() throws Exception {
        mvc.perform(get(BASE + "/photos")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
        for (String path : List.of("/photos/1", "/photo-categories/publicity/order")) {
            mvc.perform(put(BASE + path).with(csrf())).andExpect(status().isUnauthorized());
            mvc.perform(put(BASE + path).with(user("viewer").roles("VIEWER")).with(csrf()))
                    .andExpect(status().isForbidden()).andExpect(jsonPath("$.status").value(403));
            mvc.perform(put(BASE + path).with(user(FIRST).roles("PORTFOLIO_ADMIN")))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void multipartUploadRequiresTheAdminRoleAndCsrf() throws Exception {
        var path = BASE + "/photos";
        mvc.perform(multipart(path).file("file", new byte[]{1}).with(csrf().asHeader()))
                .andExpect(status().isUnauthorized());
        mvc.perform(multipart(path).file("file", new byte[]{1}).with(user("viewer").roles("VIEWER"))
                .with(csrf().asHeader())).andExpect(status().isForbidden());
        mvc.perform(multipart(path).file("file", new byte[]{1}).with(user(FIRST).roles("PORTFOLIO_ADMIN")))
                .andExpect(status().isForbidden());
    }

    @Test
    void exposesOnlyTheTwoPublicPortfolioGetRoutesAnonymously() throws Exception {
        mvc.perform(get("/api/public/portfolio")).andExpect(status().isOk());
        mvc.perform(get("/api/public/portfolio/1/media/320")).andExpect(status().isOk());
        mvc.perform(get("/api/public/portfolio/extra")).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/public/portfolio").with(csrf())).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/public/portfolio/1/media/320").with(csrf())).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/photos")).andExpect(status().isUnauthorized());
    }

    @RestController
    static class PublicReadFixture {
        @GetMapping({"/api/public/portfolio", "/api/public/portfolio/{id}/media/{variant}"})
        String read() {
            return "public";
        }
    }

    @Test
    void requiresCsrfForLoginAndLogoutAndInvalidatesSession() throws Exception {
        mvc.perform(login(FIRST, FIRST_PASSWORD, "192.0.2.13")).andExpect(status().isForbidden());
        MockHttpSession session = authenticate(FIRST, FIRST_PASSWORD, "192.0.2.13");
        mvc.perform(post(BASE + "/logout").session(session)).andExpect(status().isForbidden());

        var csrf = mvc.perform(get(BASE + "/csrf").session(session)).andExpect(status().isOk()).andReturn();
        var json = JsonPath.parse(csrf.getResponse().getContentAsString());
        mvc.perform(post(BASE + "/logout").session(session)
                        .secure(false)
                        .header(json.<String>read("$.headerName"), json.<String>read("$.token")))
                .andExpect(status().isNoContent())
                .andExpect(cookie().secure("JSESSIONID", true))
                .andExpect(cookie().httpOnly("JSESSIONID", true))
                .andExpect(cookie().path("JSESSIONID", "/"))
                .andExpect(cookie().maxAge("JSESSIONID", 0))
                .andExpect(cookie().sameSite("JSESSIONID", "Lax"));
        assertTrue(session.isInvalid());
        mvc.perform(get(BASE + "/session")).andExpect(status().isUnauthorized());
    }

    @Test
    void rateLimitsRepeatedLoginAttemptsRegardlessOfEmail() throws Exception {
        for (int attempt = 0; attempt < 8; attempt++) {
            mvc.perform(login("unknown" + attempt + "@example.test", "incorrect", "192.0.2.14").with(csrf()))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(login(FIRST, FIRST_PASSWORD, "192.0.2.14").with(csrf()))
                .andExpect(status().isTooManyRequests()).andExpect(header().exists("Retry-After"));
    }

    private MockHttpSession authenticate(String email, String password, String remoteAddress) throws Exception {
        var csrf = mvc.perform(get(BASE + "/csrf")).andExpect(status().isOk()).andReturn();
        MockHttpSession session = (MockHttpSession) csrf.getRequest().getSession(false);
        String idBeforeLogin = session.getId();
        var json = JsonPath.parse(csrf.getResponse().getContentAsString());
        mvc.perform(login(email, password, remoteAddress).session(session)
                        .header(json.<String>read("$.headerName"), json.<String>read("$.token")))
                .andExpect(status().isNoContent());
        assertNotEquals(idBeforeLogin, session.getId());
        return session;
    }

    private MockHttpServletRequestBuilder login(String email, String password, String remoteAddress) {
        return post(BASE + "/login").param("email", email).param("password", password)
                .with(request -> {
                    request.setRemoteAddr(remoteAddress);
                    return request;
                });
    }

    @TestConfiguration(proxyBeanMethods = false)
    @EnableWebMvc
    @Import({AdminSecurityConfiguration.class, AdminAccountConfiguration.class, AdminSessionController.class,
             PublicReadFixture.class})
    static class WebConfig {
        @Bean
        JdbcOperations jdbcOperations(PasswordEncoder encoder) {
            var hashes = Map.of(FIRST, encoder.encode(FIRST_PASSWORD), SECOND, encoder.encode(SECOND_PASSWORD));
            return new JdbcTemplate() {
                @Override
                public void afterPropertiesSet() {
                    // This test double never opens a JDBC connection.
                }

                @Override
                public <T> List<T> query(String sql, RowMapper<T> mapper, Object... args) {
                    String email = (String) args[0];
                    if (!hashes.containsKey(email)) {
                        return List.of();
                    }
                    try (var row = RowSetProvider.newFactory().createCachedRowSet()) {
                        var columns = new RowSetMetaDataImpl();
                        columns.setColumnCount(2);
                        columns.setColumnName(1, "email");
                        columns.setColumnName(2, "password_hash");
                        columns.setColumnType(1, Types.VARCHAR);
                        columns.setColumnType(2, Types.VARCHAR);
                        row.setMetaData(columns);
                        row.moveToInsertRow();
                        row.updateString(1, email);
                        row.updateString(2, hashes.get(email));
                        row.insertRow();
                        row.moveToCurrentRow();
                        row.next();
                        return List.of(mapper.mapRow(row, 0));
                    } catch (SQLException e) {
                        throw new AssertionError(e);
                    }
                }
            };
        }
    }
}
