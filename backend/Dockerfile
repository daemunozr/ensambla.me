# Etapa 1: compila el jar con Maven (las dependencias se cachean aparte del codigo).
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q -DskipTests package

# Etapa 2: imagen final, solo con el JRE y el jar.
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --no-create-home ensamblame
COPY --from=build /app/target/*.jar app.jar
USER ensamblame
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
