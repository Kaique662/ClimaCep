package br.com.climacep;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class ApiIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    String register(String email) throws Exception {
        String body = json.writeValueAsString(new RegisterRequest("Usuário Teste", email, "Senha@2026forte"));
        String response = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(response).get("accessToken").asText();
    }
    @Test void requiresJwtAndRestrictsFavoritesToOwner() throws Exception {
        mvc.perform(get("/api/favorites")).andExpect(status().isUnauthorized());
        String a = register(UUID.randomUUID() + "@teste.com");
        String b = register(UUID.randomUUID() + "@teste.com");
        String favorite = "{\"cep\":\"04703003\",\"nickname\":\"Morumbi\"}";
        String body = mvc.perform(post("/api/favorites").header("Authorization", "Bearer " + a)
            .contentType(MediaType.APPLICATION_JSON).content(favorite))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long id = json.readTree(body).get("id").asLong();
        mvc.perform(delete("/api/favorites/" + id).header("Authorization", "Bearer " + b))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/favorites").header("Authorization", "Bearer " + a))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].cep").value("04703003"));
        mvc.perform(delete("/api/favorites/" + id).header("Authorization", "Bearer " + a))
            .andExpect(status().isNoContent());
    }
    @Test void floodReportsArePrivateToOwnerButVisibleAnonymouslyAndCanBeUpdated() throws Exception {
        mvc.perform(get("/api/flood-reports?cep=04859240")).andExpect(status().isUnauthorized());
        String a = register(UUID.randomUUID() + "@teste.com");
        String b = register(UUID.randomUUID() + "@teste.com");
        String yes = "{\"status\":\"FLOODED\",\"note\":\"Água na rua\",\"city\":\"São Paulo\",\"state\":\"SP\"}";
        String no = "{\"status\":\"CLEAR\",\"note\":\"Via sem água\",\"city\":\"São Paulo\",\"state\":\"SP\"}";
        mvc.perform(put("/api/flood-reports/my/04859240").header("Authorization", "Bearer " + a)
            .contentType(MediaType.APPLICATION_JSON).content(yes)).andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("FLOODED"));
        mvc.perform(put("/api/flood-reports/my/04859240").header("Authorization", "Bearer " + b)
            .contentType(MediaType.APPLICATION_JSON).content(no)).andExpect(status().isOk());
        mvc.perform(get("/api/flood-reports?cep=04859240").header("Authorization", "Bearer " + a))
            .andExpect(status().isOk()).andExpect(jsonPath("$.situation").value("CONFLICTING"))
            .andExpect(jsonPath("$.floodedCount").value(1)).andExpect(jsonPath("$.clearCount").value(1))
            .andExpect(jsonPath("$.reports.length()").value(2))
            .andExpect(jsonPath("$.myReport.mine").value(true));
        mvc.perform(get("/api/flood-reports?cep=04859240").header("Authorization", "Bearer " + b))
            .andExpect(status().isOk()).andExpect(jsonPath("$.myReport.status").value("CLEAR"))
            .andExpect(jsonPath("$.reports.length()").value(2))
            .andExpect(jsonPath("$.reports[0].userId").doesNotExist());
        mvc.perform(get("/api/flood-reports?cep=04703003").header("Authorization", "Bearer " + b))
            .andExpect(status().isOk()).andExpect(jsonPath("$.situation").value("NO_REPORTS"));
        // Atualiza o relato anterior: não deve criar segundo voto.
        mvc.perform(put("/api/flood-reports/my/04859240").header("Authorization", "Bearer " + a)
            .contentType(MediaType.APPLICATION_JSON).content(no)).andExpect(status().isOk());
        mvc.perform(get("/api/flood-reports?cep=04859240").header("Authorization", "Bearer " + b))
            .andExpect(status().isOk()).andExpect(jsonPath("$.situation").value("REPORTED_CLEAR"))
            .andExpect(jsonPath("$.floodedCount").value(0)).andExpect(jsonPath("$.clearCount").value(2));
        mvc.perform(delete("/api/flood-reports/my/04859240").header("Authorization", "Bearer " + a))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/flood-reports?cep=04859240").header("Authorization", "Bearer " + b))
            .andExpect(status().isOk()).andExpect(jsonPath("$.clearCount").value(1));
        mvc.perform(get("/api/flood-reports?cep=123").header("Authorization", "Bearer " + b))
            .andExpect(status().isBadRequest());
    }
    @Test void rejectsInvalidCep() throws Exception {
        String jwt = register(UUID.randomUUID() + "@teste.com");
        mvc.perform(post("/api/favorites").header("Authorization", "Bearer " + jwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"cep\":\"123\",\"nickname\":\"Inválido\"}"))
            .andExpect(status().isBadRequest());
    }
}
