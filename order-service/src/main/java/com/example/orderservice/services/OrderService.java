package com.example.orderservice.services;

import com.example.orderservice.dtos.OrderRequestDTO;
import com.example.orderservice.dtos.OrderResponseDTO;
import com.example.orderservice.entities.Order;
import com.example.orderservice.entities.OrderStatus;
import com.example.orderservice.exceptions.InvalidOrderStateException;
import com.example.orderservice.exceptions.OrderNotFoundException;
import com.example.orderservice.exceptions.ResourceNotFoundException;
import com.example.orderservice.modele.Product;
import com.example.orderservice.repositories.OrderRepository;
import com.example.orderservice.repositories.ProductItemRepository;
import com.example.orderservice.wrappers.OrderMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService implements IOrderService {
    private final OrderRepository orderRepository;
    private final ProductItemRepository productItemRepository;
    private final InventoryService inventoryService;
    private final OrderMapper orderMapper;

    public OrderService(
            OrderRepository orderRepository,
            ProductItemRepository productItemRepository,
            InventoryService inventoryService,
            OrderMapper orderMapper
    ) {
        this.orderRepository = orderRepository;
        this.productItemRepository = productItemRepository;
        this.inventoryService = inventoryService;
        this.orderMapper = orderMapper;
    }

    @Override
    public Page<OrderResponseDTO> getOrders(int size, int page) {
        Pageable orderPage = Pageable.ofSize(size).withPage(page);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Page<Order> orders;
        if (isAdmin) {
            orders = orderRepository.findAll(orderPage);
        } else {
            Long currentCustomerId = getCurrentCustomerId(authentication);
            if (currentCustomerId == null) {
                throw new AccessDeniedException("Access denied: Missing customerId in token");
            }
            orders = orderRepository.findByCustomerId(currentCustomerId, orderPage);
        }

        return orders.map(order -> {
            populateProductItems(order);
            return orderMapper.toDTO(order);
        });
    }

    @Override
    public OrderResponseDTO getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            Long currentCustomerId = getCurrentCustomerId(authentication);
            if (currentCustomerId == null || !order.getCustomerId().equals(currentCustomerId)) {
                throw new AccessDeniedException("Access denied: You do not own this order");
            }
        }

        populateProductItems(order);
        return orderMapper.toDTO(order);
    }

    @Override
    @Transactional
    public OrderResponseDTO createOrder(OrderRequestDTO orderRequestDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            Long currentCustomerId = getCurrentCustomerId(authentication);
            if (currentCustomerId == null || !currentCustomerId.equals(orderRequestDTO.customerId())) {
                throw new AccessDeniedException("Access denied: You can only create orders for your own customer account");
            }
        }

        Order order = orderMapper.toEntity(orderRequestDTO);
        order.getProductItems().forEach(productItem -> {
            Product product = inventoryService.getProduct(productItem.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productItem.getProductId()));
            productItem.setProduct(product);
            productItem.setPrice(product.getPrice() * productItem.getQuantity());
        });

        Order savedOrder = orderRepository.save(order);
        return orderMapper.toDTO(savedOrder);
    }

    @Override
    @Transactional
    public OrderResponseDTO updateOrder(Long id) {
        Order oldOrder = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            Long currentCustomerId = getCurrentCustomerId(authentication);
            if (currentCustomerId == null || !oldOrder.getCustomerId().equals(currentCustomerId)) {
                throw new AccessDeniedException("Access denied: You do not own this order");
            }
        }

        switch (oldOrder.getOrderStatus()) {
            case CREATED:
                oldOrder.setOrderStatus(OrderStatus.PENDING);
                break;
            case PENDING:
                oldOrder.setOrderStatus(OrderStatus.DELIVERED);
                break;
            case DELIVERED:
                throw new InvalidOrderStateException("The order " + oldOrder.getId() + " was delivered");
            case CANCELED:
                throw new InvalidOrderStateException("The order " + oldOrder.getId() + " was canceled");
        }

        populateProductItems(oldOrder);
        return orderMapper.toDTO(oldOrder);
    }

    @Override
    @Transactional
    public void deleteOrder(Long id) {
        Order oldOrder = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            Long currentCustomerId = getCurrentCustomerId(authentication);
            if (currentCustomerId == null || !oldOrder.getCustomerId().equals(currentCustomerId)) {
                throw new AccessDeniedException("Access denied: You do not own this order");
            }
        }

        if (oldOrder.getOrderStatus() == OrderStatus.DELIVERED) {
            throw new InvalidOrderStateException("You can't cancel an order already delivered");
        }

        oldOrder.setOrderStatus(OrderStatus.CANCELED);
    }

    private void populateProductItems(Order order) {
        if (order.getProductItems() != null) {
            order.getProductItems().forEach(productItem -> {
                productItem.setProduct(inventoryService.getProduct(productItem.getProductId())
                        .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productItem.getProductId())));
            });
        }
    }

    private Long getCurrentCustomerId(Authentication auth) {
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            Object claim = jwtAuth.getToken().getClaim("customerId");
            if (claim != null) {
                if (claim instanceof Number number) {
                    return number.longValue();
                }
                return Long.parseLong(claim.toString());
            }
        }
        return null;
    }
}
