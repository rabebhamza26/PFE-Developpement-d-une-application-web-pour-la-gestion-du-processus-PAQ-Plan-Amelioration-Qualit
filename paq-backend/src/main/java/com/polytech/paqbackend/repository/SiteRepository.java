package com.polytech.paqbackend.repository;

import com.polytech.paqbackend.entity.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SiteRepository extends JpaRepository<Site, Long> {

}