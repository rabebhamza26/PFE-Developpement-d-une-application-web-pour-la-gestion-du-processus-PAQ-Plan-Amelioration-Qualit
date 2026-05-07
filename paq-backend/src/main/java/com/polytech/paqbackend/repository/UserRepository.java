package com.polytech.paqbackend.repository;

import com.polytech.paqbackend.dto.SiteUserDistributionDTO;
import com.polytech.paqbackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    long countByActiveFalse();
    User findByLogin(String login);
    long countByActiveTrue();
    long countByCreatedAtAfter(LocalDateTime dateTime);
    User findByEmail(String email);


    @Query("select u.role, count(u) from User u group by u.role")
    List<Object[]> countUsersByRole();

    @Query("SELECT u.email FROM User u WHERE u.email IS NOT NULL AND u.email != ''")
    List<String> findAllEmails();

    @Query("SELECT u.email FROM User u WHERE u.active = true AND u.email IS NOT NULL AND u.email != ''")
    List<String> findAllActiveUserEmails();

    // Requêtes avec jointures pour récupérer toutes les relations
    @Query("SELECT DISTINCT u FROM User u " +
            "LEFT JOIN FETCH u.sites " +
            "LEFT JOIN FETCH u.plants " +
            "LEFT JOIN FETCH u.segments " +
            "WHERE u.id = :id")
    Optional<User> findByIdWithAllRelations(@Param("id") Long id);

    @Query("SELECT DISTINCT u FROM User u " +
            "LEFT JOIN FETCH u.sites " +
            "LEFT JOIN FETCH u.plants " +
            "LEFT JOIN FETCH u.segments")
    List<User> findAllWithAllRelations();

    @Query("SELECT new com.polytech.paqbackend.dto.SiteUserDistributionDTO(s.id, s.name, COUNT(u)) " +
            "FROM User u JOIN u.sites s GROUP BY s.id, s.name ORDER BY COUNT(u) DESC")
    List<SiteUserDistributionDTO> findUserCountBySite();



    Optional<User> findOptionalByEmail(String email);



    @Query("SELECT u FROM User u WHERE u.role = 'ADMIN'")
    List<User> findAllAdmins();

}