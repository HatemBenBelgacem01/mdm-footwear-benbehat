# 1. Basis-Image auswählen (Passend zu deinem bisherigen Versuch)
FROM eclipse-temurin:25-jdk-noble

# 2. Arbeitsverzeichnis im Container erstellen
WORKDIR /usr/src/app

# 3. Projektdateien kopieren
# Zuerst nur die Dateien für die Abhängigkeiten (beschleunigt spätere Builds)
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# 4. WICHTIG: Ausführungsrechte für den Maven-Wrapper setzen
RUN chmod +x ./mvnw

# 5. Den Rest des Quellcodes und die Modelle kopieren
COPY src src
COPY models models

# 6. Anwendung bauen (Tests werden übersprungen, um Zeit zu sparen)
RUN ./mvnw -Dmaven.test.skip=true package

# 7. Port freigeben (Standard für Spring Boot)
EXPOSE 8080

# 8. Startbefehl: Die erzeugte JAR-Datei ausführen
# Hinweis: Falls dein Projektname in der pom.xml anders ist, 
# stelle sicher, dass der Dateiname unter target/*.jar übereinstimmt.
CMD ["java", "-jar", "target/footwear-0.0.1-SNAPSHOT.jar"]