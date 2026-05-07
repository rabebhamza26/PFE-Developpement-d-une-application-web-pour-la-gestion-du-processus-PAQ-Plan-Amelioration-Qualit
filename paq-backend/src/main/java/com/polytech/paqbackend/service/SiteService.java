package com.polytech.paqbackend.service;

import com.polytech.paqbackend.entity.Site;
import com.polytech.paqbackend.repository.SiteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SiteService {

    private final SiteRepository siteRepository;


    @Autowired

    public SiteService(SiteRepository siteRepository) {
        this.siteRepository = siteRepository;
    }

    public List<Site> getAll() {
        return siteRepository.findAll();
    }

    public Site getById(Long id) {
        return siteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Site not found: " + id));
    }

    public Site save(Site site) {
        return siteRepository.save(site);
    }

    public Site update(Long id, Site newSite) {
        Site site = siteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Site not found: " + id));
        site.setName(newSite.getName());
        return siteRepository.save(site);
    }

    public void delete(Long id) {
        siteRepository.deleteById(id);
    }

    public long count() {
        return siteRepository.count();
    }
}