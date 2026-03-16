package com.polytech.paqbackend.controller;




import com.polytech.paqbackend.entity.Collaborator;
import com.polytech.paqbackend.repository.CollaboratorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

        import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/collaborators")
@CrossOrigin(origins = "http://localhost:5177")


public class CollaboratorController {

    @Autowired
    private CollaboratorRepository collaboratorRepository;

    @GetMapping
    public List<Collaborator> getAll(){
        return collaboratorRepository.findAll(Sort.by("matricule"));
    }

    @PostMapping
    public Collaborator create(@RequestBody Collaborator collaborator){
        return collaboratorRepository.save(collaborator);
    }

    @PutMapping("/{matricule}")
    public Collaborator update(@PathVariable String matricule,
                               @RequestBody Collaborator collaborator){

        collaborator.setMatricule(matricule);

        return collaboratorRepository.save(collaborator);
    }

    @DeleteMapping("/{matricule}")
    public void delete(@PathVariable String  matricule){
        collaboratorRepository.deleteById(matricule);
    }

    @GetMapping("/{matricule}")
    public ResponseEntity<Collaborator> getCollaborator(@PathVariable String  matricule) {

        Optional<Collaborator> collaborator = collaboratorRepository.findById(matricule);

        if (collaborator.isPresent()) {
            return ResponseEntity.ok(collaborator.get());
        }

        return ResponseEntity.notFound().build();
    }
}
