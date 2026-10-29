package com.example.orderservice.wrappers;

import com.example.orderservice.dtos.ProductItemRequestDTO;
import com.example.orderservice.dtos.ProductItemResponseDTO;
import com.example.orderservice.entities.ProductItem;
import org.springframework.stereotype.Component;

@Component
public class ProductItemMapper {

    public ProductItemResponseDTO toDTO(ProductItem productItem) {
        if (productItem == null) return null;

        return new ProductItemResponseDTO(
                productItem.getId(),
                productItem.getProduct(),
                productItem.getPrice(),
                productItem.getQuantity()
        );
    }

    public ProductItem toEntity(ProductItemRequestDTO dto) {
        if (dto == null) return null;

        ProductItem productItem = new ProductItem();
        productItem.setProductId(dto.productId());
        productItem.setQuantity(dto.quantity());
        return productItem;
    }
}

