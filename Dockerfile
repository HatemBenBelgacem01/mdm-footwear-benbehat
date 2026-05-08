# ==========================================
# Stage 1: Builder (Kompilieren der Anwendung)
# ==========================================
FROM eclipse-temurin:25-jdk-noble AS builder

WORKDIR /app

# 1. Maven-Wrapper und Konfiguration kopieren
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN chmod +x ./mvnw

# 2. Abhängigkeiten offline herunterladen
# Das cacht die Dependencies in einem eigenen Docker-Layer. 
# Solange die pom.xml nicht geändert wird, geht dieser Schritt beim nächsten Build in Sekundenbruchteilen.
RUN ./mvnw dependency:go-offline

# 3. Quellcode kopieren (erst nach den Abhängigkeiten!)
COPY src ./src

# 4. Anwendung sauber kompilieren ("clean" löscht alte Artefakte)
RUN ./mvnw clean package -Dmaven.test.skip=true

# ==========================================
# Stage 2: Runtime (Ausführen der Anwendung)
# ==========================================
FROM eclipse-temurin:25-jdk-noble

WORKDIR /app

# 5. Modelle kopieren, da diese zur Laufzeit von der App benötigt werden
COPY models ./models

# 6. NUR die fertige JAR-Datei aus der "builder"-Stage kopieren.
# Der restliche Quellcode und der riesige .m2-Ordner mit den Abhängigkeiten werden verworfen.
COPY --from=builder /app/target/footwear-0.0.1-SNAPSHOT.jar app.jar

# 7. Port freigeben
EXPOSE 8080

# 8. Anwendung starten
CMD ["java", "-jar", "app.jar"]