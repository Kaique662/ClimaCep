-- Executar no Query Tool do pgAdmin CONECTADO ao banco 'postgres'.
-- Se o banco climacep ja existir, NAO execute novamente.
-- Nao execute manualmente V1 ou V2: o Spring Boot/Flyway cuidara das tabelas.
CREATE DATABASE climacep WITH ENCODING 'UTF8';
