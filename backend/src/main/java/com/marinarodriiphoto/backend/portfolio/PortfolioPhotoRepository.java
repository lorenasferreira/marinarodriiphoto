package com.marinarodriiphoto.backend.portfolio;

import java.util.List;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

public interface PortfolioPhotoRepository extends Repository<PortfolioPhoto, Long> {
    List<PortfolioPhoto> findAllByOrderByCategoryAscDisplayOrderAscIdAsc();

    PortfolioPhoto save(PortfolioPhoto photo);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select photo from PortfolioPhoto photo order by photo.id")
    List<PortfolioPhoto> lockAllInIdOrder();
}
