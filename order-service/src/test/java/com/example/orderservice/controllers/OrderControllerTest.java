package com.example.orderservice.controllers;

import com.example.orderservice.dtos.OrderRequestDTO;
import com.example.orderservice.dtos.ProductItemRequestDTO;
import com.example.orderservice.entities.Order;
import com.example.orderservice.entities.OrderStatus;
import com.example.orderservice.entities.ProductItem;
import com.example.orderservice.modele.Customer;
import com.example.orderservice.modele.Product;
import com.example.orderservice.repositories.OrderRepository;
import com.example.orderservice.services.CustomerService;
import com.example.orderservice.services.InventoryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ObjectMapper objectMapper;

    // Mock Keycloak JwtDecoder so tests run offline without Keycloak server
    @MockitoBean
    private JwtDecoder jwtDecoder;

    // Mock Feign Clients
    @MockitoBean
    private CustomerService customerService;

    @MockitoBean
    private InventoryService inventoryService;

    private Customer mockCustomer;
    private Product mockProduct;

    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();

        mockCustomer = new Customer();
        mockCustomer.setId(1L);
        mockCustomer.setName("Hassan");
        mockCustomer.setEmail("hassan@example.com");

        mockProduct = new Product();
        mockProduct.setId(1L);
        mockProduct.setName("Laptop");
        mockProduct.setPrice(1000.0);

        when(customerService.findById(anyLong())).thenReturn(Optional.of(mockCustomer));
        when(inventoryService.getProduct(anyLong())).thenReturn(Optional.of(mockProduct));
    }

    // =========================================================================
    // 1. Security & Authentication Tests
    // =========================================================================
    @Nested
    @DisplayName("Security & Authentication")
    class SecurityTests {

        @Test
        @DisplayName("Should return 401 Unauthorized when no JWT token is provided")
        void unauthenticatedRequest_Returns401() throws Exception {
            mockMvc.perform(get("/orders"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Should return 200 OK when valid JWT token with USER role is provided")
        void authenticatedWithUserRole_Returns200() throws Exception {
            mockMvc.perform(get("/orders")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
                    .andExpect(status().isOk());
        }
    }

    // =========================================================================
    // 2. Jakarta Validation Tests (@Valid on POST /orders)
    // =========================================================================
    @Nested
    @DisplayName("Jakarta Validation")
    class ValidationTests {

        @Test
        @DisplayName("Should return 400 when customerId is null")
        void missingCustomerId_Returns400() throws Exception {
            OrderRequestDTO request = new OrderRequestDTO(null, List.of(new ProductItemRequestDTO(1L, 2)));

            mockMvc.perform(post("/orders")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.customerId", is("Customer ID is required")));
        }

        @Test
        @DisplayName("Should return 400 when productItems is empty")
        void emptyProductItems_Returns400() throws Exception {
            OrderRequestDTO request = new OrderRequestDTO(1L, List.of());

            mockMvc.perform(post("/orders")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.productItems", is("Order must contain at least one product item")));
        }

        @Test
        @DisplayName("Should return 400 when quantity is zero or negative")
        void invalidQuantity_Returns400() throws Exception {
            OrderRequestDTO request = new OrderRequestDTO(1L, List.of(new ProductItemRequestDTO(1L, 0)));

            mockMvc.perform(post("/orders")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors['productItems[0].quantity']", is("Quantity must be at least 1")));
        }
    }

    // =========================================================================
    // 3. ControllerAdvice & Domain Rule Tests
    // =========================================================================
    @Nested
    @DisplayName("ControllerAdvice & Business Rules")
    class BusinessRuleTests {

        @Test
        @DisplayName("Should return 404 when order ID does not exist")
        void orderNotFound_Returns404() throws Exception {
            mockMvc.perform(get("/orders/999999")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.title", is("Order Not Found")))
                    .andExpect(jsonPath("$.detail", containsString("999999")));
        }

        @Test
        @DisplayName("Should return 400 when trying to advance a DELIVERED order")
        void advanceDeliveredOrder_Returns400() throws Exception {
            Order deliveredOrder = createTestOrder(OrderStatus.DELIVERED);

            mockMvc.perform(put("/orders/" + deliveredOrder.getId())
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.title", is("Invalid Order Action")))
                    .andExpect(jsonPath("$.detail", containsString("was delivered")));
        }

        @Test
        @DisplayName("Should return 400 when trying to cancel (DELETE) a DELIVERED order")
        void cancelDeliveredOrder_Returns400() throws Exception {
            Order deliveredOrder = createTestOrder(OrderStatus.DELIVERED);

            mockMvc.perform(delete("/orders/" + deliveredOrder.getId())
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.title", is("Invalid Order Action")))
                    .andExpect(jsonPath("$.detail", containsString("already delivered")));
        }
    }

    // =========================================================================
    // 4. Complete Lifecycle Tests (POST -> GET -> PUT -> DELETE)
    // =========================================================================
    @Nested
    @DisplayName("Order Lifecycle")
    class LifecycleTests {

        @Test
        @DisplayName("Happy Path: Create, Read, Update, and Cancel Order")
        void fullOrderLifecycle() throws Exception {
            // 1. POST /orders -> Create Order (Expect 201 Created)
            OrderRequestDTO createRequest = new OrderRequestDTO(1L, List.of(
                    new ProductItemRequestDTO(1L, 2)
            ));

            String postResponse = mockMvc.perform(post("/orders")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.orderStatus", is("CREATED")))
                    .andExpect(jsonPath("$.customer.name", is("Hassan")))
                    .andExpect(jsonPath("$.productItems[0].price", is(2000.0))) // 1000 * 2
                    .andReturn().getResponse().getContentAsString();

            Long orderId = objectMapper.readTree(postResponse).get("id").asLong();

            // 2. GET /orders/{id} -> Retrieve Order (Expect 200 OK)
            mockMvc.perform(get("/orders/" + orderId)
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is(orderId.intValue())))
                    .andExpect(jsonPath("$.orderStatus", is("CREATED")));

            // 3. PUT /orders/{id} -> Advance Status CREATED -> PENDING (Expect 200 OK)
            mockMvc.perform(put("/orders/" + orderId)
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.orderStatus", is("PENDING")));

            // 4. DELETE /orders/{id} -> Soft-Delete / Cancel (Expect 204 No Content)
            mockMvc.perform(delete("/orders/" + orderId)
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
                    .andExpect(status().isNoContent());

            // 5. GET /orders/{id} -> Verify State is CANCELED (Expect 200 OK)
            mockMvc.perform(get("/orders/" + orderId)
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.orderStatus", is("CANCELED")));
        }
    }

    private Order createTestOrder(OrderStatus status) {
        Order order = new Order();
        order.setCustomerId(1L);
        order.setOrderDate(LocalDateTime.now());
        order.setOrderStatus(status);

        List<ProductItem> items = new ArrayList<>();
        ProductItem item = new ProductItem();
        item.setProductId(1L);
        item.setPrice(1000.0);
        item.setQuantity(1);
        item.setOrder(order);
        items.add(item);

        order.setProductItems(items);
        return orderRepository.save(order);
    }
}
