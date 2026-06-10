# M346 Task Manager

Ein einfacher Task Manager mit Python Flask, PostgreSQL und Nginx - läuft auf Docker!

## 🚀 Schnellstart für deine Kollegen

### Voraussetzungen
- **Docker** installiert ([https://www.docker.com/](https://www.docker.com/))
- **Docker Compose** installiert (meist schon mit Docker dabei)

### App starten

```bash
# Repository klonen
git clone https://github.com/Tiziano41-code/M346.git
cd M346

# Alles starten (Postgres + Backend + Frontend)
docker-compose up
```

Das wars! 🎉

Die App läuft dann unter:
- **Frontend (WebUI)**: http://localhost
- **Backend (API)**: http://localhost:5000
- **Datenbank**: localhost:5432 (intern)

### Services stoppen

```bash
docker-compose down
```

### Daten löschen (komplett zurücksetzen)

```bash
docker-compose down -v
```

## 📁 Projekt-Struktur

```
M346/
├── backend/           # Python Flask API
│   ├── Dockerfile
│   ├── app.py        # Hauptanwendung
│   └── requirements.txt
├── frontend/          # Nginx + HTML
│   ├── Dockerfile
│   ├── html/
│   │   ├── index.html
│   │   ├── app.js
│   │   └── style.css
│   └── nginx.conf
└── docker-compose.yml # Orchestrierung aller Services
```

## 🔧 Technologie-Stack

- **Frontend**: HTML, CSS, JavaScript + Nginx
- **Backend**: Python 3.12 + Flask
- **Datenbank**: PostgreSQL 15
- **Container**: Docker

## 📝 Umgebungsvariablen

Die Datenbank-Verbindung ist in `docker-compose.yml` konfiguriert:

```yaml
DB_HOST: postgres
DB_NAME: taskdb
DB_USER: taskuser
DB_PASS: taskpass
```

## 💡 Troubleshooting

**Port 80 schon in Benutzung?**
```bash
# Port in docker-compose.yml ändern:
# ports:
#   - "8080:80"  (dann auf http://localhost:8080)
```

**Datenbank-Fehler?**
```bash
# Logs anschauen
docker-compose logs postgres

# Alles zurücksetzen
docker-compose down -v
docker-compose up
```

---

**Fragen?** Kontakt: [Dein Name]
