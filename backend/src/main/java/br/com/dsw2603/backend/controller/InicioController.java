<<<<<<< HEAD
package br.com.dsw2603.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class InicioController {

    @GetMapping("/")
    public String inicio() {
        return "Backend DSW2603 funcionando!";
    }
=======
package br.com.dsw2603.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class InicioController {

    @GetMapping("/")
    public String inicio() {
        return "Backend DSW2603 funcionando!";
    }
>>>>>>> ebc36776586299beeae08b8d1efb3538343febb6
}