package com.projectmanager.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.projectmanager.model.Product;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ProductRepository extends JsonFileRepository<Product> {

    @Override
    protected String getFileName() { return "products.json"; }

    @Override
    protected TypeReference<List<Product>> getTypeReference() {
        return new TypeReference<>() {};
    }

    public List<Product> findAll() { return readAll(); }

    public Optional<Product> findById(String id) {
        return readAll().stream().filter(p -> p.getId().equals(id)).findFirst();
    }

    public Product save(Product product) {
        List<Product> all = readAll();
        all.removeIf(p -> p.getId().equals(product.getId()));
        all.add(product);
        writeAll(all);
        return product;
    }

    public boolean deleteById(String id) {
        List<Product> all = readAll();
        boolean removed = all.removeIf(p -> p.getId().equals(id));
        if (removed) writeAll(all);
        return removed;
    }
}
