package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getNotifications(Authentication authentication) {
        String login = authentication.getName();
        List<Map<String, Object>> notifications = notificationService.getNotificationsByLogin(login);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Map<String, Object>>> getUnreadNotifications(Authentication authentication) {
        String login = authentication.getName();
        List<Map<String, Object>> notifications = notificationService.getUnreadNotificationsByLogin(login);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/count/unread")
    public ResponseEntity<Map<String, Long>> countUnread(Authentication authentication) {
        String login = authentication.getName();
        long count = notificationService.countUnreadByLogin(login);
        Map<String, Long> response = new HashMap<>();
        response.put("count", count);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, Authentication authentication) {
        String login = authentication.getName();
        notificationService.markAsRead(id, login);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<Map<String, Integer>> markAllAsRead(Authentication authentication) {
        String login = authentication.getName();
        int count = notificationService.markAllAsRead(login);
        Map<String, Integer> response = new HashMap<>();
        response.put("marquees", count);
        return ResponseEntity.ok(response);
    }
}