package com.projectmanager.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public abstract class JsonFileRepository<T> {

    @Value("${app.data.path}")
    private String dataPath;

    protected final ObjectMapper objectMapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    protected abstract String getFileName();
    protected abstract TypeReference<List<T>> getTypeReference();

    protected File getFile() {
        File dir = new File(dataPath);
        if (!dir.exists()) dir.mkdirs();
        return new File(dir, getFileName());
    }

    protected List<T> readAll() {
        File file = getFile();
        if (!file.exists()) return new ArrayList<>();
        try {
            return objectMapper.readValue(file, getTypeReference());
        } catch (IOException e) {
            throw new RuntimeException("Veri okunamadi: " + getFileName(), e);
        }
    }

    protected void writeAll(List<T> items) {
        try {
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(getFile(), items);
        } catch (IOException e) {
            throw new RuntimeException("Veri yazilamadi: " + getFileName(), e);
        }
    }
}
