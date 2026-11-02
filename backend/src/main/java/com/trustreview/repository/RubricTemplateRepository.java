package com.trustreview.repository;

import com.trustreview.model.RubricTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RubricTemplateRepository extends JpaRepository<RubricTemplate, String> {
    List<RubricTemplate> findAllByOrderByNameAsc();
    Page<RubricTemplate> findAllByOrderByNameAsc(Pageable pageable);
    boolean existsByName(String name);
}
