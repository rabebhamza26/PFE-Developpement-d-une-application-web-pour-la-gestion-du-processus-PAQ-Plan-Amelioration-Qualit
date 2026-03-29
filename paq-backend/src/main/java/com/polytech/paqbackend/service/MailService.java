package com.polytech.paqbackend.service;

import com.polytech.paqbackend.entity.PremierEntretien;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service  // <-- Important pour que Spring le reconnaisse
public class MailService {

    private final JavaMailSender sender;

    @Autowired
    public MailService(JavaMailSender sender) {
        this.sender = sender;
    }

    public void sendEntretienMail(String matricule, PremierEntretien entretien) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo("manager@example.com"); // à remplacer par l'email réel
        message.setSubject("Nouvel entretien pour " + matricule);
        message.setText(
                "Un entretien a été enregistré :\n" +
                        "Type: " + entretien.getTypeFaute() + "\n" +
                        "Gravité: " + entretien.getGravite() + "\n" +
                        "Date: " + entretien.getDateFaute() + "\n" +
                        "Commentaire: " + entretien.getCommentaire()
        );
        sender.send(message);
    }
}