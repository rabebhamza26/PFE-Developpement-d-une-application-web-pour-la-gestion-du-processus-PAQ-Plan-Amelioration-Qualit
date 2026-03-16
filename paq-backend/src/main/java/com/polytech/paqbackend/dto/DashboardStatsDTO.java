package com.polytech.paqbackend.dto;

public class DashboardStatsDTO {

    private long totalUsers;
    private long activeUsers;
    private long totalPaqs;
    private long totalCollaborators;

    private long newUsersThisMonth;
    private long newPaqsThisMonth;
    private long activeCollaborators;

    public DashboardStatsDTO() {}

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

    public long getActiveUsers() { return activeUsers; }
    public void setActiveUsers(long activeUsers) { this.activeUsers = activeUsers; }

    public long getTotalPaqs() { return totalPaqs; }
    public void setTotalPaqs(long totalPaqs) { this.totalPaqs = totalPaqs; }

    public long getTotalCollaborators() { return totalCollaborators; }
    public void setTotalCollaborators(long totalCollaborators) { this.totalCollaborators = totalCollaborators; }

    public long getNewUsersThisMonth() { return newUsersThisMonth; }
    public void setNewUsersThisMonth(long newUsersThisMonth) { this.newUsersThisMonth = newUsersThisMonth; }

    public long getNewPaqsThisMonth() { return newPaqsThisMonth; }
    public void setNewPaqsThisMonth(long newPaqsThisMonth) { this.newPaqsThisMonth = newPaqsThisMonth; }

    public long getActiveCollaborators() { return activeCollaborators; }
    public void setActiveCollaborators(long activeCollaborators) { this.activeCollaborators = activeCollaborators; }
}
