# Checklist de entrega — requisitos obrigatórios

| Exigência | Implementação | Onde verificar |
|---|---|---|
| React Native frontend | Expo SDK 58 / JavaScript | `mobile/App.js` |
| Pelo menos 5 telas e login | Login, Cadastro, Início, Enchentes, Favoritos, Histórico e Perfil | `mobile/src/screens/`, `mobile/App.js` |
| Navegação e transições | React Navigation (stack de autenticação e abas) | `mobile/App.js` |
| JWT no Spring Boot | Spring Security OAuth2 Resource Server HS256, BCrypt | `backend/.../AuthService.java`, `SecurityConfig.java` |
| API REST | /api/auth, /api/users, /api/favorites, /api/history | `backend/.../*Controller.java` |
| Gerenciamento de estado | Context API (sessão) + hooks (telas, clima) | `mobile/src/app/AuthContext.js`, `WeatherDashboard.js` |
| AsyncStorage | Último CEP por usuário | `mobile/App.js` |
| Banco relacional | PostgreSQL hospedado no Supabase (`users`, `favorites`, `search_history`, `flood_reports`) | Schema `public` no Supabase, migrações Flyway |
| CRUD | Adicionar/listar/editar/excluir regiões favoritas | `FavoriteController.java`, `FavoritesScreen.js` |

## Testes manuais recomendados

- [ ] Abrir o app e cadastrar usuário novo (deve iniciar sessão).
- [ ] Sair e fazer login com a conta cadastrada.
- [ ] Confirmar que rota GET `/api/favorites` sem Bearer retorna 401.
- [ ] Buscar `04859240` e `04703003`; conferir CEP, coordenadas e todos os indicadores.
- [ ] Adicionar favorito na tela Inicial; editar apelido em Favoritos e excluir.
- [ ] Registrar e remover pesquisa no Histórico; verificar no Supabase.
- [ ] Atualizar nome e senha em Perfil.
- [ ] Reiniciar o Expo Go e confirmar recuperação da sessão e último CEP.
- [ ] Entrar com outra conta e confirmar isolamento dos favoritos e do histórico.
- [ ] Testar CEP inválido, sem internet, backend desligado e token expirado.

> Os itens acima são um **plano de validação**. Não devem ser marcados como concluídos até serem realmente executados no dispositivo e no backend do usuário.


## Funcionalidade adicional — Alertas comunitários de enchente

- [ ] Aba **Enchentes** acessível após login (7 telas ao todo).
- [ ] Consulta de relatos por CEP e endereço obtido de API pública.
- [ ] Reportar **Há alagamento** com observação e data/hora.
- [ ] Outra conta visualiza relato sem nome ou e-mail de quem enviou.
- [ ] Reportar **Sem alagamento** com outra conta: resultado divergente.
- [ ] Usuário atualiza ou exclui apenas seu próprio relato.
- [ ] CEPs diferentes mantêm relatos independentes.
- [ ] Relatos anteriores a 24 horas não são contados como recentes.
- [ ] Dados são persistidos em PostgreSQL (`flood_reports` via Flyway V2).
- [ ] Aviso "não são alertas oficiais" aparece na tela.
