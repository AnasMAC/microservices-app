package com.example.orderservice.services;

import com.example.orderservice.dtos.OrderRequestDTO;
import com.example.orderservice.dtos.OrderResponseDTO;
import com.example.orderservice.entities.Order;
import com.example.orderservice.entities.OrderStatus;
import org.springframework.data.domain.Page;

public interface IOrderService {
    public Page<OrderResponseDTO> getOrders(int size , int page);
    public OrderResponseDTO getOrderById(Long id);
    public OrderResponseDTO createOrder(OrderRequestDTO order);
    public OrderResponseDTO updateOrder(Long id);
    public void deleteOrder(Long id);
}
