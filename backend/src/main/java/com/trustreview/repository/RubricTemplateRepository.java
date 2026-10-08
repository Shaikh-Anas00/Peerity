package com.trustreview.repository;

import com.trustreview.model.RubricTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RubricTemplateRepository extends JpaRepository<RubricTemplate, String> {
    List<RubricTemplate> findAllByOrderByNameAsc();
    boolean existsByName(String name);
}
