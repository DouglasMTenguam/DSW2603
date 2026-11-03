# ---------- etapa 1: compila o projeto ----------
FROM eclipse-temurin:21-jdk AS build
WORKDIR /dsw2603_db

# baixa as dependências primeiro (fica em cache se o pom.xml não mudar)
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -q dependency:go-offline

COPY src src
RUN ./mvnw -q package -DskipTests

# ---------- etapa 2: imagem final, só com o JRE ----------
FROM eclipse-temurin:21-jre
WORKDIR /dsw2603_db
COPY --from=build /dsw2603_db/target/*.jar dsw2603_db.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "dsw2603_db.jar"]