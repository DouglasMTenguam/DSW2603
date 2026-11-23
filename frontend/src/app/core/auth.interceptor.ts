import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { AUTH_URL } from './api.config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const ehLogin = req.url === `${AUTH_URL}/login`;
  const precisaToken = auth.token && !ehLogin && !req.headers.has('Authorization');
  const reqFinal = precisaToken ? req.clone({ setHeaders: { Authorization: `Bearer ${auth.token}` } }) : req;

  return next(reqFinal).pipe(
    catchError((e: HttpErrorResponse) => {
      if (e.status === 401 && !ehLogin && auth.logado()) auth.logout();   // token vencido (8h) ou inválido
      return throwError(() => e);
    }),
  );
};
