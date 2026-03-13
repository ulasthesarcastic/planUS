package com.projectmanager.service;

import com.projectmanager.model.Product;
import com.projectmanager.repository.PersonnelRepository;
import com.projectmanager.repository.ProductRepository;
import com.projectmanager.repository.ProjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final PersonnelRepository personnelRepository;
    private final ProjectRepository projectRepository;

    public ProductService(ProductRepository productRepository,
                          PersonnelRepository personnelRepository,
                          ProjectRepository projectRepository) {
        this.productRepository = productRepository;
        this.personnelRepository = personnelRepository;
        this.projectRepository = projectRepository;
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

    public boolean delete(String id) {
        boolean deleted = productRepository.deleteById(id);
        if (deleted) {
            // Ürünü kullanan projelerdeki referansı temizle
            projectRepository.findAll().forEach(project -> {
                List<String> ids = project.getProductIds();
                if (ids != null && ids.contains(id)) {
                    ids.remove(id);
                    project.setProductIds(ids);
                    projectRepository.save(project);
                }
            });
        }
        return deleted;
    }

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
