package com.example.orderservice.controllers;

import com.example.orderservice.dtos.OrderRequestDTO;
import com.example.orderservice.dtos.ProductItemRequestDTO;
import com.example.orderservice.entities.Order;
import com.example.orderservice.entities.OrderStatus;
import com.example.orderservice.entities.ProductItem;
import com.example.orderservice.modele.Product;
import com.example.orderservice.repositories.OrderRepository;
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

    @MockitoBean
    private InventoryService inventoryService;

    private Product mockProduct;

    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();

        mockProduct = new Product();
        mockProduct.setId(1L);
        mockProduct.setName("Laptop");
        mockProduct.setPrice(1000.0);
        mockProduct.setImgUrl("https://example.com/laptop.jpg");

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
        @DisplayName("Should return 200 OK when valid JWT token with USER role and customerId is provided")
        void authenticatedWithUserRole_Returns200() throws Exception {
            mockMvc.perform(get("/orders")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                    .jwt(j -> j.claim("customerId", 1L))))
                    .andExpect(status().isOk());
        }
    }

    // =========================================================================
    // 2. Customer Order Isolation & Authorization (Multi-Tenancy)
    // =========================================================================
    @Nested
    @DisplayName("Customer Isolation & Authorization")
    class CustomerIsolationTests {

        @Test
        @DisplayName("User should only see their own orders on GET /orders")
        void userSeesOnlyOwnOrders() throws Exception {
            createTestOrder(1L, OrderStatus.CREATED);
            createTestOrder(1L, OrderStatus.PENDING);
            createTestOrder(2L, OrderStatus.CREATED); // Belongs to customer 2

            mockMvc.perform(get("/orders")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                    .jwt(j -> j.claim("customerId", 1L))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(2)))
                    .andExpect(jsonPath("$.content[*].customerId", everyItem(is(1))));
        }

        @Test
        @DisplayName("Admin should see all orders across all customers on GET /orders")
        void adminSeesAllOrders() throws Exception {
            createTestOrder(1L, OrderStatus.CREATED);
            createTestOrder(2L, OrderStatus.CREATED);

            mockMvc.perform(get("/orders")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(2)));
        }

        @Test
        @DisplayName("User can view their own order by ID")
        void userCanViewOwnOrderById() throws Exception {
            Order ownOrder = createTestOrder(1L, OrderStatus.CREATED);

            mockMvc.perform(get("/orders/" + ownOrder.getId())
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                    .jwt(j -> j.claim("customerId", 1L))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is(ownOrder.getId().intValue())))
                    .andExpect(jsonPath("$.customerId", is(1)));
        }

        @Test
        @DisplayName("User cannot view another customer's order by ID (403 Forbidden)")
        void userCannotViewOtherCustomerOrder() throws Exception {
            Order otherOrder = createTestOrder(2L, OrderStatus.CREATED);

            mockMvc.perform(get("/orders/" + otherOrder.getId())
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                    .jwt(j -> j.claim("customerId", 1L))))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.title", is("Access Denied")));
        }

        @Test
        @DisplayName("Admin can view any customer's order by ID")
        void adminCanViewAnyCustomerOrder() throws Exception {
            Order order = createTestOrder(2L, OrderStatus.CREATED);

            mockMvc.perform(get("/orders/" + order.getId())
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is(order.getId().intValue())))
                    .andExpect(jsonPath("$.customerId", is(2)));
        }

        @Test
        @DisplayName("User cannot create an order on behalf of another customer (403 Forbidden)")
        void userCannotCreateOrderForAnotherCustomer() throws Exception {
            OrderRequestDTO request = new OrderRequestDTO(2L, List.of(new ProductItemRequestDTO(1L, 1)));

            mockMvc.perform(post("/orders")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                    .jwt(j -> j.claim("customerId", 1L)))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.title", is("Access Denied")));
        }

        @Test
        @DisplayName("User cannot cancel (DELETE) another customer's order (403 Forbidden)")
        void userCannotCancelOtherCustomerOrder() throws Exception {
            Order otherOrder = createTestOrder(2L, OrderStatus.CREATED);

            mockMvc.perform(delete("/orders/" + otherOrder.getId())
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                    .jwt(j -> j.claim("customerId", 1L))))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.title", is("Access Denied")));
        }
    }

    // =========================================================================
    // 3. Jakarta Validation Tests (@Valid on POST /orders)
    // =========================================================================
    @Nested
    @DisplayName("Jakarta Validation")
    class ValidationTests {

        @Test
        @DisplayName("Should return 400 when customerId is null")
        void missingCustomerId_Returns400() throws Exception {
            OrderRequestDTO request = new OrderRequestDTO(null, List.of(new ProductItemRequestDTO(1L, 2)));

            mockMvc.perform(post("/orders")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                    .jwt(j -> j.claim("customerId", 1L)))
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
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                    .jwt(j -> j.claim("customerId", 1L)))
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
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                    .jwt(j -> j.claim("customerId", 1L)))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors['productItems[0].quantity']", is("Quantity must be at least 1")));
        }
    }

    // =========================================================================
    // 4. ControllerAdvice & Domain Rule Tests
    // =========================================================================
    @Nested
    @DisplayName("ControllerAdvice & Business Rules")
    class BusinessRuleTests {

        @Test
        @DisplayName("Should return 404 when order ID does not exist")
        void orderNotFound_Returns404() throws Exception {
            mockMvc.perform(get("/orders/999999")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                    .jwt(j -> j.claim("customerId", 1L))))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.title", is("Order Not Found")))
                    .andExpect(jsonPath("$.detail", containsString("999999")));
        }

        @Test
        @DisplayName("Should return 400 when trying to advance a DELIVERED order")
        void advanceDeliveredOrder_Returns400() throws Exception {
            Order deliveredOrder = createTestOrder(1L, OrderStatus.DELIVERED);

            mockMvc.perform(put("/orders/" + deliveredOrder.getId())
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                    .jwt(j -> j.claim("customerId", 1L))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.title", is("Invalid Order Action")))
                    .andExpect(jsonPath("$.detail", containsString("was delivered")));
        }

        @Test
        @DisplayName("Should return 400 when trying to cancel (DELETE) a DELIVERED order")
        void cancelDeliveredOrder_Returns400() throws Exception {
            Order deliveredOrder = createTestOrder(1L, OrderStatus.DELIVERED);

            mockMvc.perform(delete("/orders/" + deliveredOrder.getId())
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                    .jwt(j -> j.claim("customerId", 1L))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.title", is("Invalid Order Action")))
                    .andExpect(jsonPath("$.detail", containsString("already delivered")));
        }
    }

    // =========================================================================
    // 5. Complete Lifecycle Tests (POST -> GET -> PUT -> DELETE)
    // =========================================================================
    @Nested
    @DisplayName("Order Lifecycle")
    class LifecycleTests {

        @Test
        @DisplayName("Happy Path: Create, Read, Update, and Cancel Order for own customerId")
        void fullOrderLifecycle() throws Exception {
            // 1. POST /orders -> Create Order (Expect 201 Created)
            OrderRequestDTO createRequest = new OrderRequestDTO(1L, List.of(
                    new ProductItemRequestDTO(1L, 2)
            ));

            String postResponse = mockMvc.perform(post("/orders")
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                    .jwt(j -> j.claim("customerId", 1L)))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.orderStatus", is("CREATED")))
                    .andExpect(jsonPath("$.customerId", is(1)))
                    .andExpect(jsonPath("$.productItems[0].price", is(2000.0))) // 1000 * 2
                    .andReturn().getResponse().getContentAsString();

            Long orderId = objectMapper.readTree(postResponse).get("id").asLong();

            // 2. GET /orders/{id} -> Retrieve Order (Expect 200 OK)
            mockMvc.perform(get("/orders/" + orderId)
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                    .jwt(j -> j.claim("customerId", 1L))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is(orderId.intValue())))
                    .andExpect(jsonPath("$.customerId", is(1)))
                    .andExpect(jsonPath("$.orderStatus", is("CREATED")));

            // 3. PUT /orders/{id} -> Advance Status CREATED -> PENDING (Expect 200 OK)
            mockMvc.perform(put("/orders/" + orderId)
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                    .jwt(j -> j.claim("customerId", 1L))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.orderStatus", is("PENDING")));

            // 4. DELETE /orders/{id} -> Soft-Delete / Cancel (Expect 204 No Content)
            mockMvc.perform(delete("/orders/" + orderId)
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                    .jwt(j -> j.claim("customerId", 1L))))
                    .andExpect(status().isNoContent());

            // 5. GET /orders/{id} -> Verify State is CANCELED (Expect 200 OK)
            mockMvc.perform(get("/orders/" + orderId)
                            .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                    .jwt(j -> j.claim("customerId", 1L))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.orderStatus", is("CANCELED")));
        }
    }

    private Order createTestOrder(Long customerId, OrderStatus status) {
        Order order = new Order();
        order.setCustomerId(customerId);
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
