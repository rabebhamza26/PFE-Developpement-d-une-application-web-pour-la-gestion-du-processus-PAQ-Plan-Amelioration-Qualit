package com.polytech.paqbackend.service;

import com.polytech.paqbackend.entity.Plant;
import com.polytech.paqbackend.entity.Site;
import com.polytech.paqbackend.repository.PlantRepository;
import com.polytech.paqbackend.repository.SiteRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlantService {



        private final PlantRepository plantRepository;
        private final SiteRepository siteRepository;

        public PlantService(PlantRepository plantRepository, SiteRepository siteRepository) {
            this.plantRepository = plantRepository;
            this.siteRepository = siteRepository;
        }

        public List<Plant> getAll() {
            return plantRepository.findAll();
        }

        public Plant getById(Long id) {
            return plantRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Plant not found: " + id));
        }

        public Plant save(Plant plant) {
            if (plant.getSite() != null && plant.getSite().getId() != null) {
                Site site = siteRepository.findById(plant.getSite().getId())
                        .orElseThrow(() -> new RuntimeException("Site non trouvé : " + plant.getSite().getId()));
                plant.setSite(site);
            }
            return plantRepository.save(plant);
        }

        public Plant update(Long id, Plant updatedPlant) {
            Plant plant = plantRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Plant non trouvé : " + id));

            plant.setName(updatedPlant.getName());

            if (updatedPlant.getSite() != null && updatedPlant.getSite().getId() != null) {
                Site site = siteRepository.findById(updatedPlant.getSite().getId())
                        .orElseThrow(() -> new RuntimeException("Site non trouvé : " + updatedPlant.getSite().getId()));
                plant.setSite(site);
            }

            return plantRepository.save(plant);
        }

        public void delete(Long id) {
            plantRepository.deleteById(id);
        }

        public List<Plant> getBySite(Long siteId) {
            return plantRepository.findBySite_Id(siteId);
        }
    }