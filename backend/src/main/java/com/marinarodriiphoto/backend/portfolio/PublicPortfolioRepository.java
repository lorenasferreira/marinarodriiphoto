package com.marinarodriiphoto.backend.portfolio;

import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.Repository;

interface PublicPortfolioRepository extends Repository<PortfolioPhoto, Long> {
    List<PortfolioPhoto> findAllByPublishedTrue();

    Optional<PortfolioPhoto> findByIdAndPublishedTrue(long id);
}
