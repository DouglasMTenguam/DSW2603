/** O backend expõe /api/... (protegido) e /auth/login (público). Em dev o proxy.conf.json
 *  e em produção o nginx encaminham os dois prefixos para o Spring Boot. */
export const API_URL = '/api';
export const AUTH_URL = '/auth';
