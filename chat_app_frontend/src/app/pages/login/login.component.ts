import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  nickname = '';
  errorMessage: string = '';
  isLoginMode = true; // Toggle between login and register

  constructor(public authService: AuthService, private router: Router) {}

  login(): void {
    // Validate fields
    if (!this.email.trim() || !this.password.trim()) {
      this.errorMessage = 'Todos los campos son obligatorios para iniciar sesión.';
      return;
    }

    const credentials = { email: this.email, password: this.password };
    this.authService.login(credentials).subscribe(
      (response) => {
        this.authService.saveToken(response.token, response.expiration, response.nickname);
        this.router.navigate(['/']); // Redirect to root
      },
      (error) => {
        // Mostrar el mensaje del backend si existe
        console.log(error);
        if (error.status === 401) {
          this.errorMessage = error.error?.error || 'Credenciales incorrectas. Por favor revisa tus credenciales.';
        } else if (error.status === 500) {
          this.errorMessage = 'Ocurrió un error en el servidor. Por favor, intenta nuevamente más tarde.';
        } else {
          this.errorMessage = 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';
        }
      }
    );
  }

  register(): void {
    // Validate fields
    if (!this.email.trim() || !this.password.trim() || !this.nickname.trim()) {
      this.errorMessage = 'Todos los campos son obligatorios para registrarse.';
      return;
    }

    const credentials = { email: this.email, password: this.password, nickname: this.nickname };
    this.authService.register(credentials).subscribe(
      (response) => {
        // Crear y descargar el archivo .txt con el enlace de validación
        const validationLink = response.validation_link;
        const fileContent = `Hola ${this.nickname},\n\nPor favor valida tu cuenta haciendo clic en el siguiente enlace:\n${validationLink}`;
        const blob = new Blob([fileContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.email}.txt`; // Nombre del archivo basado en el email
        a.click();
        window.URL.revokeObjectURL(url); // Liberar el objeto URL

        // Cambiar al modo de inicio de sesión después del registro
        this.errorMessage = 'Registro exitoso. Se ha generado un archivo con el enlace de validación.';
        this.isLoginMode = true;
      },
      (error) => {
        if (error.status === 422) {
          this.errorMessage = error.error?.message || 'Error al registrarse. Por favor, verifica tus datos.';
        } else if (error.status === 500) {
          this.errorMessage = 'Ocurrió un error en el servidor. Por favor, intenta nuevamente más tarde.';
        } else {
          this.errorMessage = 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';
        }
      }
    );
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode; // Toggle between login and register
    this.errorMessage = ''; // Clear any error messages
  }
}
