package com.marinarodriiphoto.backend;

import com.marinarodriiphoto.backend.config.CloudinaryConfig;
import com.marinarodriiphoto.backend.portfolio.PortfolioPhoto;
import com.marinarodriiphoto.backend.portfolio.PortfolioPhotoRepository;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.persistenceunit.PersistenceManagedTypes;

@SpringBootApplication(scanBasePackageClasses = {CloudinaryConfig.class, PortfolioPhoto.class})
@EnableJpaRepositories(basePackageClasses = PortfolioPhotoRepository.class)
public class BackendApplication {

	// Validate only Portfolio mappings against the development schema.
	@Bean
	PersistenceManagedTypes persistenceManagedTypes() {
		return PersistenceManagedTypes.of(PortfolioPhoto.class.getName());
	}

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
