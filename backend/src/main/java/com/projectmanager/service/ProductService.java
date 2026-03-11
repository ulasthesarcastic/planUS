package com.projectmanager.service;

import com.projectmanager.model.Product;
import com.projectmanager.repository.PersonnelRepository;
import com.projectmanager.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final PersonnelRepository personnelRepository;

    public ProductService(ProductRepository productRepository,
                          PersonnelRepository personnelRepository) {
        this.productRepository = productRepository;
        this.personnelRepository = personnelRepository;
    }

    public List<Product> getAll() { return productRepository.findAll(); }

    public Optional<Product> getById(String id) { return productRepository.findById(id); }

    public Product create(Product product) {
        validate(product);
        product.setId(UUID.randomUUID().toString());
        return productRepository.save(product);
    }

    public Optional<Product> update(String id, Product updated) {
        validate(updated);
        return productRepository.findById(id).map(existing -> {
            existing.setName(updated.getName());
            existing.setOwnerId(updated.getOwnerId());
            existing.setDescription(updated.getDescription());
            existing.setTrlLevel(updated.getTrlLevel());
            return productRepository.save(existing);
        });
    }

    public boolean delete(String id) { return productRepository.deleteById(id); }

    private void validate(Product p) {
        if (p.getName() == null || p.getName().isBlank())
            throw new IllegalArgumentException("Ürün adı zorunludur.");
        if (p.getTrlLevel() < 1 || p.getTrlLevel() > 9)
            throw new IllegalArgumentException("TRL seviyesi 1-9 arasında olmalıdır.");
        if (p.getOwnerId() != null && !p.getOwnerId().isBlank()) {
            personnelRepository.findById(p.getOwnerId())
                .orElseThrow(() -> new IllegalArgumentException("Geçersiz ürün sahibi."));
        }
    }
}
