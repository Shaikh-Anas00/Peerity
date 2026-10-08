package com.trustreview.config;

import com.trustreview.model.RubricTemplate;
import com.trustreview.repository.RubricTemplateRepository;
import com.trustreview.service.StarterTemplates;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Seeds the built-in starter rubric templates. Idempotent: existing names are left untouched. */
@Component
@Profile("!test")
public class RubricTemplateSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(RubricTemplateSeeder.class);

    private final RubricTemplateRepository templateRepository;

    public RubricTemplateSeeder(RubricTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    @Override
    public void run(String... args) {
        int created = 0;
        for (RubricTemplate t : StarterTemplates.all()) {
            if (!templateRepository.existsByName(t.getName())) {
                templateRepository.save(t);
                created++;
            }
        }
        logger.info("Rubric template seeding complete ({} new, {} total starters).", created, StarterTemplates.all().size());
    }
}
