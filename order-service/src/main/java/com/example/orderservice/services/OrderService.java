package com.example.orderservice.services;

import com.example.orderservice.dtos.OrderRequestDTO;
import com.example.orderservice.dtos.OrderResponseDTO;
import com.example.orderservice.entities.Order;
import com.example.orderservice.entities.OrderStatus;
import com.example.orderservice.entities.ProductItem;
import com.example.orderservice.modele.Customer;
import com.example.orderservice.modele.Product;
import com.example.orderservice.repositories.OrderRepository;
import com.example.orderservice.repositories.ProductItemRepository;
import com.example.orderservice.wrappers.OrderMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService implements IOrderService {
    private final OrderRepository orderRepository;
    private final ProductItemRepository productItemRepository;
    private final CustomerService customerService;
    private final InventoryService inventoryService;
    private final OrderMapper orderMapper;

    public OrderService(
            OrderRepository orderRepository,
            ProductItemRepository productItemRepository,
            CustomerService customerService,
            InventoryService inventoryService,
            OrderMapper orderMapper

    ){
        this.orderRepository = orderRepository;
        this.productItemRepository = productItemRepository;
        this.customerService = customerService;
        this.inventoryService = inventoryService;
        this.orderMapper = orderMapper;
    }
    @Override
    public Page<OrderResponseDTO> getOrders(int size, int page) {
        Pageable orderPage = Pageable.ofSize(size).withPage(page);

        return orderRepository.findAll(orderPage).map(
                order -> {
                    order.setCustomer(customerService.findById(order.getCustomerId())
                            .orElseThrow(() -> new RuntimeException("Customer not found with id: " + order.getCustomerId())));
                    if (order.getProductItems() != null) {
                        order.getProductItems().forEach(productItem -> {
                            productItem.setProduct(inventoryService.getProduct(productItem.getProductId())
                                    .orElseThrow(() -> new RuntimeException("Product not found with id: " + productItem.getProductId())));
                        });
                    }
                    return orderMapper.toDTO(order);
                }
        );
    }

    @Override
    public OrderResponseDTO getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        order.setCustomer(customerService.findById(order.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + order.getCustomerId())));

        if (order.getProductItems() != null) {
            order.getProductItems().forEach(productItem -> {
                productItem.setProduct(inventoryService.getProduct(productItem.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found with id: " + productItem.getProductId())));
            });
        }

        return orderMapper.toDTO(order);
    }

    @Override
    @Transactional
    public OrderResponseDTO createOrder(OrderRequestDTO orderRequestDTO) {
        Customer customer = customerService.findById(orderRequestDTO.customerId())
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + orderRequestDTO.customerId()));

        Order order = orderMapper.toEntity(orderRequestDTO);
        order.getProductItems().forEach(productItem -> {
            Product product = inventoryService.getProduct(productItem.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found with id: " + productItem.getProductId()));
            productItem.setProduct(product);
            productItem.setPrice(product.getPrice() * productItem.getQuantity());
        });

        Order savedOrder = orderRepository.save(order);
        savedOrder.setCustomer(customer);

        return orderMapper.toDTO(savedOrder);
    }

    @Override
    @Transactional
    public OrderResponseDTO updateOrder(Long id) {
        Order oldOrder = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        switch (oldOrder.getOrderStatus()) {
            case CREATED:
                oldOrder.setOrderStatus(OrderStatus.PENDING);
                break;
            case PENDING:
                oldOrder.setOrderStatus(OrderStatus.DELIVERED);
                break;
            case DELIVERED:
                throw new RuntimeException("the order " + oldOrder.getId() + " was delivered");
            case CANCELED:
                throw new RuntimeException("the order " + oldOrder.getId() + " was canceled");
        }

        Customer customer = customerService.findById(oldOrder.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + oldOrder.getCustomerId()));
        oldOrder.setCustomer(customer);

        if (oldOrder.getProductItems() != null) {
            oldOrder.getProductItems().forEach(productItem -> {
                Product product = inventoryService.getProduct(productItem.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found with id: " + productItem.getProductId()));
                productItem.setProduct(product);
                productItem.setPrice(product.getPrice() * productItem.getQuantity());
            });
        }

        return orderMapper.toDTO(oldOrder);
    }

    @Override
    @Transactional
    public void deleteOrder(Long id) {
        Order oldOrder = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        if (oldOrder.getOrderStatus() == OrderStatus.DELIVERED) {
            throw new RuntimeException("you can't cancel an order already delivered");
        }

        oldOrder.setOrderStatus(OrderStatus.CANCELED);
    }


}
