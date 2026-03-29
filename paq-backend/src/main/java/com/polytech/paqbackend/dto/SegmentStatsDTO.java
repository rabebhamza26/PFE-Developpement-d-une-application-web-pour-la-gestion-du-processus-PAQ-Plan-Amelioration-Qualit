package com.polytech.paqbackend.dto;

public class SegmentStatsDTO {

        private String nom;
        private long totalCollaborateurs;
        private long paqNiveau1;
        private long paqNiveau2;
        private long paqNiveau3;
        private long paqNiveau4;
        private long paqNiveau5;
        private long sansFaute;

        public SegmentStatsDTO() {}

        public SegmentStatsDTO(String nom, long totalCollaborateurs, long paqNiveau1,
                               long paqNiveau2, long paqNiveau3, long paqNiveau4,
                               long paqNiveau5, long sansFaute) {
            this.nom = nom;
            this.totalCollaborateurs = totalCollaborateurs;
            this.paqNiveau1 = paqNiveau1;
            this.paqNiveau2 = paqNiveau2;
            this.paqNiveau3 = paqNiveau3;
            this.paqNiveau4 = paqNiveau4;
            this.paqNiveau5 = paqNiveau5;
            this.sansFaute = sansFaute;
        }

        // Getters and setters
        public String getNom() { return nom; }
        public void setNom(String nom) { this.nom = nom; }

        public long getTotalCollaborateurs() { return totalCollaborateurs; }
        public void setTotalCollaborateurs(long totalCollaborateurs) { this.totalCollaborateurs = totalCollaborateurs; }

        public long getPaqNiveau1() { return paqNiveau1; }
        public void setPaqNiveau1(long paqNiveau1) { this.paqNiveau1 = paqNiveau1; }

        public long getPaqNiveau2() { return paqNiveau2; }
        public void setPaqNiveau2(long paqNiveau2) { this.paqNiveau2 = paqNiveau2; }

        public long getPaqNiveau3() { return paqNiveau3; }
        public void setPaqNiveau3(long paqNiveau3) { this.paqNiveau3 = paqNiveau3; }

        public long getPaqNiveau4() { return paqNiveau4; }
        public void setPaqNiveau4(long paqNiveau4) { this.paqNiveau4 = paqNiveau4; }

        public long getPaqNiveau5() { return paqNiveau5; }
        public void setPaqNiveau5(long paqNiveau5) { this.paqNiveau5 = paqNiveau5; }

        public long getSansFaute() { return sansFaute; }
        public void setSansFaute(long sansFaute) { this.sansFaute = sansFaute; }
    }