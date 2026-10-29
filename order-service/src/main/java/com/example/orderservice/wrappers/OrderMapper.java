package com.example.orderservice.wrappers;

import com.example.orderservice.dtos.OrderRequestDTO;
import com.example.orderservice.dtos.OrderResponseDTO;
import com.example.orderservice.dtos.ProductItemResponseDTO;
import com.example.orderservice.entities.Order;
import com.example.orderservice.entities.OrderStatus;
import com.example.orderservice.entities.ProductItem;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class OrderMapper {

    private final ProductItemMapper productItemMapper;

    public OrderMapper(ProductItemMapper productItemMapper) {
        this.productItemMapper = productItemMapper;
    }

    // Entity -> ResponseDTO
    public OrderResponseDTO toDTO(Order order) {
        if (order == null) return null;

        List<ProductItemResponseDTO> items = order.getProductItems() == null
                ? List.of()
                : order.getProductItems().stream()
                .map(productItemMapper::toDTO)
                .toList();

        return new OrderResponseDTO(
                order.getId(),
                order.getOrderDate(),
                order.getOrderStatus(),
                order.getCustomer(),
                items
        );
    }

    // RequestDTO -> Entity (for creating order)
    public Order toEntity(OrderRequestDTO dto) {
        if (dto == null) return null;

        Order order = new Order();
        order.setCustomerId(dto.customerId());
        order.setOrderDate(LocalDateTime.now());
        order.setOrderStatus(OrderStatus.CREATED);

        if (dto.productItems() != null) {
            List<ProductItem> items = dto.productItems().stream()
                    .map(itemDto -> {
                        ProductItem item = productItemMapper.toEntity(itemDto);
                        item.setOrder(order);
                        return item;
                    })
                    .toList();
            order.setProductItems(items);
        }

        return order;
    }
}
