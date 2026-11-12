package com.example.customerservice.controllers;

import com.example.customerservice.entites.Customer;
import com.example.customerservice.repositories.CustomerRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class CustomerRestApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ObjectMapper objectMapper;

    // Mock Keycloak JwtDecoder so tests run offline without external server
    @MockitoBean
    private JwtDecoder jwtDecoder;

    @BeforeEach
    void setUp() {
        customerRepository.deleteAll();
        customerRepository.save(new Customer(null, "Ensat", "contact@ensat-media.ma"));
        customerRepository.save(new Customer(null, "FSTM", "contact@fstm.ma"));
    }

    // =========================================================================
    // 1. Security & Authentication Tests
    // =========================================================================
    @Nested
    @DisplayName("Security & Authentication")
    class SecurityTests {

        @Test
        @DisplayName("Should return 401 Unauthorized when no JWT token is provided")
        void unauthenticated_Returns401() throws Exception {
            mockMvc.perform(get("/customers"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Should return 403 Forbidden when regular USER accesses customers (Admin only)")
        void userRole_Returns403() throws Exception {
            mockMvc.perform(get("/customers")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should return 200 OK when valid ADMIN token is provided")
        void adminRole_Returns200() throws Exception {
            mockMvc.perform(get("/customers")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$._embedded.customers", hasSize(2)));
        }
    }

    // =========================================================================
    // 2. Jakarta Validation Tests
    // =========================================================================
    @Nested
    @DisplayName("Jakarta Validation")
    class ValidationTests {

        @Test
        @DisplayName("Should return 400 when customer name is null or blank")
        void blankName_Returns400() throws Exception {
            Customer invalid = new Customer(null, null, "valid@example.ma");

            mockMvc.perform(post("/customers")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalid)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.name", containsString("required")));
        }

        @Test
        @DisplayName("Should return 400 when customer name is too short (< 2 chars)")
        void nameTooShort_Returns400() throws Exception {
            Customer invalid = new Customer(null, "A", "valid@example.ma");

            mockMvc.perform(post("/customers")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalid)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.name", containsString("between 2 and 50")));
        }

        @Test
        @DisplayName("Should return 400 when email format is invalid")
        void invalidEmail_Returns400() throws Exception {
            Customer invalid = new Customer(null, "Amine", "not-a-valid-email");

            mockMvc.perform(post("/customers")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalid)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.email", containsString("valid email address")));
        }

        @Test
        @DisplayName("Should return 400 when body is empty")
        void emptyBody_Returns400() throws Exception {
            mockMvc.perform(post("/customers")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest());
        }
    }

    // =========================================================================
    // 3. CRUD & Projection Tests
    // =========================================================================
    @Nested
    @DisplayName("CRUD & Projection Operations")
    class CrudTests {

        @Test
        @DisplayName("Should create customer successfully (201 Created) for ADMIN")
        void createValidCustomer_Returns201() throws Exception {
            Customer validCustomer = new Customer(null, "Karim Tazi", "karim.tazi@example.ma");

            mockMvc.perform(post("/customers")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validCustomer)))
                    .andExpect(status().isCreated())
                    .andExpect(header().string("Location", containsString("/customers/")));
        }

        @Test
        @DisplayName("Should retrieve customer with fullCustomer projection for ADMIN")
        void getCustomerWithProjection_Returns200() throws Exception {
            Customer saved = customerRepository.findAll().get(0);

            mockMvc.perform(get("/customers/" + saved.getId() + "?projection=fullCustomer")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is(saved.getId().intValue())))
                    .andExpect(jsonPath("$.name", is(saved.getName())))
                    .andExpect(jsonPath("$.email", is(saved.getEmail())));
        }
    }
}
