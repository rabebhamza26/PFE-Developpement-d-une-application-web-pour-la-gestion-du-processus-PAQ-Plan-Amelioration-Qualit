package com.polytech.paqbackend.dto;

import java.util.List;
import java.util.Map;

public class DashboardStatsDTO {

    private long totalUsers;
    private long activeUsers;
    private long totalPaqs;
    private long totalCollaborateurs;

    private long newUsersThisMonth;
    private long newPaqsThisMonth;
    private long activeCollaborators;

    private long inactiveUsers;
    private long totalSegments;
    private Map<String, Long> roleCounts;

    private List<CollaborateurDTO> sansFaute;
    private Map<Integer, Long> paqParNiveau; // ✅ ajouté
    private long paqEnCours; // ✅ ajouté

    public List<CollaborateurDTO> getSansFaute() { return sansFaute; }
    public void setSansFaute(List<CollaborateurDTO> sansFaute) { this.sansFaute = sansFaute; }

    public DashboardStatsDTO() {}

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

    public long getActiveUsers() { return activeUsers; }
    public void setActiveUsers(long activeUsers) { this.activeUsers = activeUsers; }

    public long getTotalPaqs() { return totalPaqs; }
    public void setTotalPaqs(long totalPaqs) { this.totalPaqs = totalPaqs; }

    public long getTotalCollaborateurs() { return totalCollaborateurs; }
    public void setTotalCollaborateurs(long totalCollaborateurs) { this.totalCollaborateurs = totalCollaborateurs; }

    public long getNewUsersThisMonth() { return newUsersThisMonth; }
    public void setNewUsersThisMonth(long newUsersThisMonth) { this.newUsersThisMonth = newUsersThisMonth; }

    public long getNewPaqsThisMonth() { return newPaqsThisMonth; }
    public void setNewPaqsThisMonth(long newPaqsThisMonth) { this.newPaqsThisMonth = newPaqsThisMonth; }

    public long getActiveCollaborators() { return activeCollaborators; }
    public void setActiveCollaborators(long activeCollaborators) { this.activeCollaborators = activeCollaborators; }









        public long getInactiveUsers() { return inactiveUsers; }
        public void setInactiveUsers(long inactiveUsers) { this.inactiveUsers = inactiveUsers; }

        public long getTotalSegments() { return totalSegments; }
        public void setTotalSegments(long totalSegments) { this.totalSegments = totalSegments; }

        public Map<String, Long> getRoleCounts() { return roleCounts; }
        public void setRoleCounts(Map<String, Long> roleCounts) { this.roleCounts = roleCounts; }

    public Map<Integer, Long> getPaqParNiveau() {
        return paqParNiveau;
    }

    public void setPaqParNiveau(Map<Integer, Long> paqParNiveau) {
        this.paqParNiveau = paqParNiveau;
    }

    public long getPaqEnCours() {
        return paqEnCours;
    }

    public void setPaqEnCours(long paqEnCours) {
        this.paqEnCours = paqEnCours;
    }
}





