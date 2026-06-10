const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, AlignmentType, LevelFormat, TableOfContents,
  HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign,
  PageNumber, PageBreak
} = require("docx");

const SHOTS = "C:\\M346\\doku\\screenshots";

// ---- Farben ----
const BLUE = "1F4E79";
const BLUE_LIGHT = "D6E4F0";
const GREY = "F2F2F2";
const GREY_LINE = "BBBBBB";
const ACCENT = "2E86AB";

// ---- PNG-Grösse lesen (IHDR) ----
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

// ---- Helfer ----
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after === undefined ? 120 : opts.after, line: 276 },
    alignment: opts.align,
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italics, color: opts.color, size: opts.size })]
  });
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 60, line: 276 },
    children: [new TextRun(text)]
  });
}
function numbered(text, ref = "steps") {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 60, line: 276 },
    children: [new TextRun(text)]
  });
}

function caption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 240 },
    children: [new TextRun({ text, italics: true, size: 18, color: "666666" })]
  });
}

// Code-Box: einzelne Zelle, grau hinterlegt, Monospace
function code(lines) {
  const para = lines.map((l, i) => new Paragraph({
    spacing: { after: i === lines.length - 1 ? 0 : 0, line: 240 },
    children: [new TextRun({ text: l.length ? l : " ", font: "Consolas", size: 18 })]
  }));
  const border = { style: BorderStyle.SINGLE, size: 2, color: "D0D0D0" };
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: 9360, type: WidthType.DXA },
        shading: { fill: GREY, type: ShadingType.CLEAR },
        borders: { top: border, bottom: border, left: border, right: border },
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        children: para
      })]
    })]
  });
}

// Bild zentriert, auf Breite skaliert
function img(name, maxW = 600) {
  const file = path.join(SHOTS, name);
  const { w, h } = pngSize(file);
  const width = Math.min(maxW, w);
  const height = Math.round(width * (h / w));
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 0 },
    children: [new ImageRun({
      type: "png",
      data: fs.readFileSync(file),
      transformation: { width, height },
      altText: { title: name, description: name, name: name }
    })]
  });
}

// Tabelle mit Kopfzeile
function table(headers, rows, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  const border = { style: BorderStyle.SINGLE, size: 1, color: GREY_LINE };
  const borders = { top: border, bottom: border, left: border, right: border };
  const headRow = new TableRow({
    tableHeader: true,
    children: headers.map((htxt, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: BLUE, type: ShadingType.CLEAR },
      borders,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ children: [new TextRun({ text: htxt, bold: true, color: "FFFFFF", size: 20 })] })]
    }))
  });
  const bodyRows = rows.map((r, ri) => new TableRow({
    children: r.map((cell, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: ri % 2 === 0 ? "FFFFFF" : "EEF3F9", type: ShadingType.CLEAR },
      borders,
      margins: { top: 70, bottom: 70, left: 120, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })]
    }))
  }));
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headRow, ...bodyRows]
  });
}

function spacer(after = 120) {
  return new Paragraph({ spacing: { after }, children: [new TextRun("")] });
}

// ===================== INHALT =====================
const content = [];

// ---- Titelseite ----
content.push(new Paragraph({ spacing: { before: 1200, after: 0 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "MODUL 346", bold: true, size: 72, color: BLUE })] }));
content.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
  children: [new TextRun({ text: "Cloud Lösungen konzipieren und realisieren", size: 28, color: ACCENT })] }));
content.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
  children: [new TextRun({ text: "Containerisierte Web-Anwendung mit Kubernetes", bold: true, size: 40 })] }));
content.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
  children: [new TextRun({ text: "Nginx, Flask und PostgreSQL auf Minikube", size: 26, color: "555555" })] }));
content.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 8 } },
  children: [new TextRun("")] }));

content.push(table(
  ["Feld", "Angabe"],
  [
    ["Modul", "M346 Cloud Lösungen konzipieren und realisieren"],
    ["Thema", "Containerisierte Web-Anwendung mit Kubernetes"],
    ["Gruppe", "Tiziano Ferraro, Albin Hoti, Tim Mostak"],
    ["Plattform", "Debian 12 VM mit Minikube"],
    ["VM-IP", "192.168.177.133"],
    ["Erstellt am", "3. Juni 2026"],
    ["Abgabe", "3. Juni 2026"]
  ],
  [2600, 6760]
));
content.push(new Paragraph({ children: [new PageBreak()] }));

// ---- Inhaltsverzeichnis ----
content.push(h1("Inhaltsverzeichnis"));
content.push(new TableOfContents("Inhaltsverzeichnis", { hyperlink: true, headingStyleRange: "1-2" }));
content.push(new Paragraph({ children: [new PageBreak()] }));

// ---- 1. Einleitung ----
content.push(h1("1. Einleitung"));

content.push(h2("1.1 Ausgangslage"));
content.push(p("Im Modul 346 hatten wir den Auftrag, eine Web-Anwendung aus mehreren Diensten mit Containern zu bauen und mit Kubernetes zu betreiben. Wir haben uns für eine klassische Drei-Schichten-App entschieden: ein Frontend, ein Backend mit einer REST-API und eine Datenbank. Jeder Teil läuft in einem eigenen Container."));
content.push(p("Als Anwendung haben wir einen Task Manager gebaut. Man kann Aufgaben anlegen, abhaken, mit einer Priorität versehen und wieder löschen. Die App ist bewusst einfach gehalten, damit der Fokus auf der Technik dahinter bleibt: Docker, Kubernetes und das Zusammenspiel der drei Dienste."));
content.push(p("Alles läuft auf einer Debian 12 VM mit Minikube. Minikube ist ein kleines Kubernetes für den eigenen Rechner. Unser Lehrer hat im Feedback verlangt, dass Minikube bei jedem von uns lokal läuft, damit jeder die Services zeigen, steuern und erklären kann. Genau so haben wir es aufgebaut."));

content.push(h2("1.2 Team und Aufgaben"));
content.push(table(
  ["Name", "Schwerpunkt"],
  [
    ["Tiziano Ferraro", "Docker- und Kubernetes-Setup, VM, Deployment"],
    ["Tim Mostak", "Frontend mit HTML, CSS und JavaScript, Tests im Browser"],
    ["Albin Hoti", "Backend mit Flask, REST-API, PostgreSQL, Dokumentation"]
  ],
  [2600, 6760]
));
content.push(spacer());
content.push(p("Die Aufgaben haben wir aufgeteilt, aber das meiste haben wir zusammen vor dem gleichen Bildschirm gemacht. So hat jeder den ganzen Ablauf einmal gesehen und kann ihn auch erklären."));

content.push(h2("1.3 Ziele"));
content.push(bullet("Eine Web-App aus drei Containern bauen: Frontend, Backend und Datenbank"));
content.push(bullet("Die drei Dienste mit Kubernetes auf Minikube betreiben"));
content.push(bullet("Die Dienste über Kubernetes-Networking miteinander reden lassen"));
content.push(bullet("Eine REST-API mit den vier CRUD-Operationen anlegen, lesen, ändern und löschen"));
content.push(bullet("Daten in PostgreSQL dauerhaft speichern"));
content.push(bullet("Minikube bei jedem im Team lokal zum Laufen bringen"));

content.push(h2("1.4 Angestrebte Kompetenzen"));
content.push(table(
  ["Kompetenz", "Was dahinter steckt"],
  [
    ["Container", "Eigene Images mit einem Dockerfile bauen"],
    ["Kubernetes", "Deployments, Services und einen Namespace anlegen und verwalten"],
    ["Networking", "Dienste über Service-Namen im Cluster verbinden"],
    ["REST-API", "Eine API mit Flask schreiben und ans Frontend anbinden"],
    ["Datenbank", "PostgreSQL als Container mit dauerhaftem Speicher betreiben"],
    ["Linux", "Auf einer Debian VM über SSH arbeiten"]
  ],
  [2600, 6760]
));
content.push(new Paragraph({ children: [new PageBreak()] }));

// ---- 2. Grundlagen ----
content.push(h1("2. Grundlagen"));

content.push(h2("2.1 Docker und Container"));
content.push(p("Docker packt eine Anwendung mit allem, was sie braucht, in einen Container. Drin sind der Code, die Bibliotheken und die Konfiguration. Der Container läuft überall gleich, egal auf welchem Rechner."));
content.push(p("Der Unterschied zu einer VM ist der Kernel. Container teilen sich den Kernel vom Host und bringen kein eigenes Betriebssystem mit. Deshalb starten sie in Sekunden und brauchen nur wenig Speicher."));

content.push(h2("2.2 Kubernetes"));
content.push(p("Kubernetes verwaltet Container. Es startet sie, hält sie am Leben und verbindet sie miteinander. Fällt ein Container aus, startet Kubernetes ihn von selbst neu. Die wichtigsten Bausteine bei uns:"));
content.push(bullet("Pod: die kleinste Einheit, in der ein Container läuft"));
content.push(bullet("Deployment: beschreibt, welcher Container läuft und wie viele Kopien"));
content.push(bullet("Service: gibt den Pods eine feste Adresse im Cluster, damit sie sich finden"));
content.push(bullet("Namespace: ein eigener Bereich für unsere Objekte, bei uns m346"));

content.push(h2("2.3 Minikube"));
content.push(p("Minikube ist ein Kubernetes für den eigenen Rechner. Es startet einen kleinen Cluster in einem Container. Damit kann man Kubernetes lokal ausprobieren, ohne eine Cloud zu mieten. Für die Schule passt das gut, weil jeder seinen eigenen Cluster hat."));

content.push(h2("2.4 Nginx als Frontend"));
content.push(p("Nginx ist ein schneller Webserver. Wir nehmen die Variante nginx:alpine, die nur rund 62 MB gross ist. Nginx liefert unsere HTML-, CSS- und JS-Dateien aus. Er hat noch eine zweite Aufgabe: Anfragen an die API leitet er an das Backend weiter. So sieht der Browser nur eine einzige Adresse."));

content.push(h2("2.5 Flask und die REST-API"));
content.push(p("Flask ist ein kleines Web-Framework für Python. Damit haben wir das Backend gebaut. Es bietet eine REST-API mit vier Operationen: anlegen (POST), lesen (GET), ändern (PUT) und löschen (DELETE). Das nennt man CRUD. Das Backend spricht mit der Datenbank und gibt die Antworten als JSON zurück."));

content.push(h2("2.6 PostgreSQL"));
content.push(p("PostgreSQL ist eine bekannte relationale Datenbank. Wir nehmen das Image postgres:16-alpine. Hier landen alle Aufgaben mit Titel, Priorität, Datum und Status. Damit die Daten einen Neustart überleben, hängen wir ein Volume an."));
content.push(new Paragraph({ children: [new PageBreak()] }));

// ---- 3. Aufbau ----
content.push(h1("3. Aufbau des Projekts"));

content.push(h2("3.1 Wie alles zusammenhängt"));
content.push(p("Auf Minikube laufen drei Pods nebeneinander. Eine Anfrage läuft so durch das System:"));
content.push(numbered("Der Browser ruft das Frontend auf. Nginx liefert die Seite aus.", "flow"));
content.push(numbered("Klickt man auf Hinzufügen, schickt das JavaScript eine Anfrage an /api.", "flow"));
content.push(numbered("Nginx leitet diese Anfrage an das Backend weiter.", "flow"));
content.push(numbered("Das Backend verarbeitet sie und spricht mit PostgreSQL.", "flow"));
content.push(numbered("Die Antwort geht den gleichen Weg zurück bis in den Browser.", "flow"));
content.push(p("Die drei Pods finden sich über ihre Service-Namen. Das Backend erreicht die Datenbank unter postgres-service, das Frontend erreicht das Backend unter backend-service. Diese Namen löst Kubernetes intern selbst auf."));

content.push(h2("3.2 Dateistruktur"));
content.push(p("Jeder Dienst hat seinen eigenen Ordner mit einem Dockerfile. Die Kubernetes-Dateien liegen zusammen im Ordner k8s."));
content.push(code([
  "M346/",
  "|-- frontend/",
  "|   |-- Dockerfile",
  "|   |-- nginx.conf          # leitet /api an das Backend weiter",
  "|   \\-- html/               # index.html, style.css, app.js",
  "|-- backend/",
  "|   |-- Dockerfile",
  "|   |-- requirements.txt",
  "|   \\-- app.py              # Flask REST-API",
  "\\-- k8s/",
  "    |-- namespace.yaml",
  "    |-- secret.yaml",
  "    |-- postgres-deployment.yaml",
  "    |-- backend-deployment.yaml",
  "    \\-- frontend-deployment.yaml"
]));

content.push(h2("3.3 Die drei Services und ihre Netzwerk-Typen"));
content.push(table(
  ["Service", "Image", "Service-Typ", "Port"],
  [
    ["Frontend", "nginx:alpine", "NodePort", "80 / 30080"],
    ["Backend", "m346-backend (Flask)", "ClusterIP", "5000"],
    ["Datenbank", "postgres:16-alpine", "ClusterIP", "5432"]
  ],
  [2000, 3360, 2200, 1800]
));
content.push(spacer());
content.push(p("Ein ClusterIP ist nur im Cluster erreichbar. Das passt für Backend und Datenbank, die niemand von aussen direkt braucht. Das Frontend ist ein NodePort, damit man es von aussen erreichen kann."));

content.push(h2("3.4 Ports und Adressen"));
content.push(table(
  ["Dienst", "Adresse"],
  [
    ["VM (Debian)", "192.168.177.133"],
    ["Frontend im Browser", "http://192.168.177.133:8080 (über port-forward)"],
    ["Backend (intern)", "backend-service:5000"],
    ["Datenbank (intern)", "postgres-service:5432"]
  ],
  [2800, 6560]
));
content.push(new Paragraph({ children: [new PageBreak()] }));

// ---- 4. Umsetzung ----
content.push(h1("4. Umsetzung"));

content.push(h2("4.1 Frontend: Dockerfile und nginx.conf"));
content.push(p("Das Dockerfile für das Frontend ist kurz. Wir nehmen das offizielle Image nginx:alpine, kopieren unsere Konfiguration hinein und legen die Webseite ins Webroot."));
content.push(code([
  "FROM nginx:alpine",
  "COPY nginx.conf /etc/nginx/conf.d/default.conf",
  "COPY html/ /usr/share/nginx/html/"
]));
content.push(spacer());
content.push(p("In der nginx.conf steht der wichtige Teil: Alles unter /api/ schickt Nginx an das Backend weiter. Der Browser merkt davon nichts und spricht nur mit einer Adresse."));
content.push(code([
  "location /api/ {",
  "    proxy_pass http://backend-service:5000/;",
  "}"
]));

content.push(h2("4.2 Backend: Flask mit REST-API"));
content.push(p("Das Backend ist eine Flask-App. Für jede der vier CRUD-Operationen gibt es einen Endpoint. Hier als Beispiel das Anlegen einer Aufgabe. Die Daten kommen als JSON, das Backend schreibt sie in PostgreSQL und gibt die neue Aufgabe zurück."));
content.push(code([
  "@app.route('/tasks', methods=['POST'])",
  "def create_task():",
  "    data = request.get_json()",
  "    title = data.get('title', '').strip()",
  "    priority = data.get('priority', 'medium')",
  "    cur.execute(",
  "        'INSERT INTO tasks (title, priority) VALUES (%s, %s) RETURNING id',",
  "        (title, priority))",
  "    return jsonify({'id': task_id, 'title': title}), 201"
]));

content.push(h2("4.3 Datenbank: PostgreSQL"));
content.push(p("Die Datenbank bekommt ihre Zugangsdaten nicht im Klartext, sondern aus einem Kubernetes Secret. Ein Volume sorgt dafür, dass die Daten einen Neustart überleben. Mehr dazu in Kapitel 5."));

content.push(h2("4.4 Die Kubernetes-Manifeste"));
content.push(p("Jeder Dienst hat ein Deployment und einen Service. Das Deployment sagt, welcher Container läuft. Der Service gibt ihm eine feste Adresse. Hier der Service für das Frontend als NodePort. Über den Port 30080 ist die App von aussen erreichbar."));
content.push(code([
  "apiVersion: v1",
  "kind: Service",
  "metadata:",
  "  name: frontend-service",
  "  namespace: m346",
  "spec:",
  "  type: NodePort",
  "  selector:",
  "    app: frontend",
  "  ports:",
  "    - port: 80",
  "      targetPort: 80",
  "      nodePort: 30080"
]));

content.push(h2("4.5 Projekt auf die VM bringen"));
content.push(p("Die Dateien haben wir von Windows aus per scp auf die Debian VM kopiert. Davor haben wir die IP der VM geprüft. Sie lautet 192.168.177.133."));
content.push(code([
  "scp -r C:/M346 root@192.168.177.133:/root/"
]));
content.push(img("01-vm-netzwerk.png"));
content.push(caption("Abbildung 1: Netzwerk-Infos der Debian VM, über die IP 192.168.177.133 arbeiten wir"));

content.push(h2("4.6 Minikube starten und Images bauen"));
content.push(p("Auf der VM haben wir Minikube gestartet. Als root braucht der Docker-Treiber das Flag --force, sonst bricht der Start ab."));
content.push(code([
  "minikube start --driver=docker --force"
]));
content.push(spacer());
content.push(p("Danach haben wir die beiden eigenen Images gebaut, eines für das Frontend und eines für das Backend. Wir bauen direkt in Minikube hinein, damit der Cluster die Images findet."));
content.push(code([
  "minikube image build -t m346-frontend:latest ./frontend",
  "minikube image build -t m346-backend:latest ./backend"
]));
content.push(img("02-minikube-deploy.png"));
content.push(caption("Abbildung 2: Minikube ist gestartet, danach bauen wir die Images und legen die Kubernetes-Objekte an"));

content.push(h2("4.7 Deployen und prüfen"));
content.push(p("Mit kubectl apply haben wir alle Objekte angelegt: den Namespace, das Secret und die drei Deployments mit ihren Services."));
content.push(code([
  "kubectl apply -f k8s/",
  "kubectl get pods -n m346"
]));
content.push(spacer());
content.push(p("Nach kurzer Zeit standen alle drei Pods auf Running. Damit war klar, dass Frontend, Backend und Datenbank laufen."));
content.push(code([
  "NAME                        READY   STATUS    RESTARTS   AGE",
  "backend-7945dc56c6-vqt2w    1/1     Running   0          73s",
  "frontend-578f6f754d-5kb56   1/1     Running   0          73s",
  "postgres-7687d94ffd-x7jv7   1/1     Running   0          73s"
]));

content.push(h2("4.8 Frontend erreichbar machen mit port-forward"));
content.push(p("Innerhalb von Minikube hat das Frontend die IP 192.168.49.2. Von Windows aus ist diese Adresse nicht erreichbar. Mit kubectl port-forward leiten wir den Port auf die VM weiter. Das Flag --address=0.0.0.0 sorgt dafür, dass der Port auch von aussen erreichbar ist."));
content.push(code([
  "kubectl port-forward -n m346 svc/frontend-service 8080:80 --address=0.0.0.0"
]));
content.push(img("03-port-forward.png"));
content.push(caption("Abbildung 3: Der port-forward läuft und nimmt Verbindungen auf Port 8080 an"));
content.push(spacer());
content.push(p("Jetzt konnten wir die App im Browser unter http://192.168.177.133:8080 öffnen. Die erste Version vom Task Manager war da, und ein Task liess sich anlegen."));
content.push(img("04-app-erste-version.png"));
content.push(caption("Abbildung 4: Die erste Version vom Task Manager im Browser"));
content.push(new Paragraph({ children: [new PageBreak()] }));

// ---- 5. Erweiterungen ----
content.push(h1("5. Erweiterungen"));
content.push(p("Damit das Projekt mehr als nur das Minimum zeigt, haben wir ein paar Dinge ergänzt, die man in echten Kubernetes-Setups auch findet."));

content.push(h2("5.1 Kubernetes Secrets"));
content.push(p("Das Passwort der Datenbank steht nicht mehr im Klartext im Deployment, sondern in einem Secret. Das Backend und PostgreSQL holen sich die Zugangsdaten von dort. So liegt das Passwort an einer Stelle und nicht in jeder Datei."));

content.push(h2("5.2 PersistentVolumeClaim"));
content.push(p("PostgreSQL bekommt einen festen Speicher über einen PersistentVolumeClaim. Vorher lagen die Daten in einem emptyDir und waren nach einem Neustart des Pods weg. Mit dem Volume bleiben die Aufgaben erhalten."));

content.push(h2("5.3 Liveness und Readiness Probes"));
content.push(p("Jeder Pod hat zwei Checks. Die Liveness Probe prüft, ob der Container noch lebt. Hängt er, startet Kubernetes ihn neu. Die Readiness Probe prüft, ob der Container schon bereit ist. Erst dann schickt Kubernetes ihm Anfragen."));

content.push(h2("5.4 Resource Limits"));
content.push(p("Wir haben jedem Pod Grenzen für CPU und Speicher gegeben. So kann kein Dienst die ganze Maschine belegen. Das ist in Cloud-Umgebungen üblich, weil dort viele Container nebeneinander laufen."));

content.push(h2("5.5 Priorität und Datum in der App"));
content.push(p("In der App kann man jeder Aufgabe eine Priorität geben: Tief, Mittel oder Hoch. Dafür gibt es ein Dropdown neben dem Eingabefeld. Jede Aufgabe bekommt ausserdem ein Erstellungsdatum, das die App automatisch setzt."));
content.push(img("07-prioritaet-dropdown.png"));
content.push(caption("Abbildung 5: Das neue Dropdown für die Priorität neben dem Eingabefeld"));
content.push(new Paragraph({ children: [new PageBreak()] }));

// ---- 6. Ergebnisse ----
content.push(h1("6. Ergebnisse"));

content.push(h2("6.1 Die App läuft"));
content.push(p("Der Task Manager läuft im Browser. Aufgaben lassen sich anlegen, abhaken und löschen. Jede Aufgabe zeigt ihre Priorität als farbiges Label und das Datum, an dem sie erstellt wurde. Damit sind alle vier CRUD-Operationen sichtbar im Einsatz."));
content.push(img("08-app-final.png"));
content.push(caption("Abbildung 6: Die fertige App mit Prioritäts-Labels und Erstellungsdatum"));

content.push(h2("6.2 Alle drei Pods laufen"));
content.push(p("Ein Blick auf die Services zeigt, wie die drei Dienste verdrahtet sind. Frontend als NodePort, Backend und Datenbank als ClusterIP."));
content.push(code([
  "NAME               TYPE        CLUSTER-IP      PORT(S)        ",
  "backend-service    ClusterIP   10.96.233.54    5000/TCP       ",
  "frontend-service   NodePort    10.102.62.156   80:30080/TCP   ",
  "postgres-service   ClusterIP   10.106.69.111   5432/TCP       "
]));

content.push(h2("6.3 Das Zusammenspiel stimmt"));
content.push(p("Dass die drei Dienste wirklich miteinander reden, haben wir direkt geprüft. Vom Frontend-Pod aus haben wir die API des Backends aufgerufen. Die Antwort kam als JSON, mit Titel, Priorität und Datum. Damit war klar: Frontend, Backend und Datenbank arbeiten zusammen."));
content.push(code([
  "kubectl exec -n m346 deploy/frontend -- wget -qO- http://backend-service:5000/tasks",
  "",
  "[{\"id\":6,\"title\":\"test3\",\"priority\":\"medium\",\"created_at\":\"03.06.2026 13:06\"}, ...]"
]));
content.push(new Paragraph({ children: [new PageBreak()] }));

// ---- 7. Reflexion ----
content.push(h1("7. Reflexion und Fazit"));

content.push(h2("7.1 Zielerreichung"));
content.push(table(
  ["Anforderung", "Status"],
  [
    ["Frontend (Nginx) als Container auf Minikube", "Erfüllt"],
    ["Backend (Flask) mit REST-API und CRUD", "Erfüllt"],
    ["PostgreSQL speichert die Daten dauerhaft", "Erfüllt"],
    ["Die drei Dienste reden über Kubernetes-Networking", "Erfüllt"],
    ["Frontend von aussen erreichbar (NodePort, port-forward)", "Erfüllt"],
    ["Secrets, Probes, Volume und Resource Limits eingebaut", "Erfüllt"],
    ["Minikube läuft lokal auf dem Rechner", "Erfüllt"]
  ],
  [7060, 2300]
));

content.push(h2("7.2 Was wir gelernt haben"));
content.push(bullet("Wie man drei Container mit Kubernetes verbindet und über Service-Namen ansprechbar macht"));
content.push(bullet("Dass ein ClusterIP nur intern gilt und man für den Zugriff von aussen NodePort oder port-forward braucht"));
content.push(bullet("Wie ein Secret und ein Volume in ein Deployment eingebunden werden"));
content.push(bullet("Dass die Versionen von Docker und Minikube zusammenpassen müssen"));

content.push(h2("7.3 Schwierigkeiten"));
content.push(p("Hier hatten wir ein paar echte Stolpersteine. Die schreiben wir bewusst auf, weil wir daran am meisten gelernt haben."));
content.push(p("Minikube als root: Minikube wollte mit dem Docker-Treiber nicht als root starten. Mit dem Flag --force lief es.", { bold: false }));
content.push(p("Docker zu alt: Beim Bauen über die Minikube-Umgebung kam der Fehler, der Client mit Version 1.41 sei zu alt. Statt direkt in dieser Umgebung zu bauen, haben wir die Images mit minikube image build gebaut. Danach lief es."));
content.push(p("Seite nicht erreichbar: Über die interne IP 192.168.49.2 kamen wir von Windows aus nicht auf die Seite."));
content.push(img("05-fehler-clusterip.png"));
content.push(caption("Abbildung 7: Über die interne IP 192.168.49.2 war die Seite von Windows aus nicht erreichbar"));
content.push(p("Die Lösung war kubectl port-forward mit --address=0.0.0.0. Damit horcht der Port auf allen Adressen und wir erreichen die App über die VM-IP."));
content.push(p("Backend nicht erreichbar: Nach einem Update zeigte die App kurz die Meldung, das Backend sei nicht erreichbar."));
content.push(img("06-fehler-backend.png"));
content.push(caption("Abbildung 8: Fehlermeldung, bevor wir den alten Pod neu gestartet hatten"));
content.push(p("Der Grund war ein alter Pod und der Browser-Cache. Nach einem kubectl delete pod und einem harten Neuladen mit Strg+Shift+R war alles wieder da."));

content.push(h2("7.4 Fazit"));
content.push(p("Wir haben alle Ziele erreicht. Die drei Container laufen auf Minikube, reden über Kubernetes-Networking miteinander und speichern die Daten dauerhaft in PostgreSQL. Die App kann Aufgaben anlegen, ändern und löschen. Dazu kommen Secrets, Probes und ein Volume, wie man es in echten Setups macht."));
content.push(p("Am meisten hat uns geholfen, dass wir die Fehler selbst gelöst haben. Gerade der Punkt mit ClusterIP und port-forward hat uns gezeigt, wie das Netzwerk in Kubernetes wirklich funktioniert. Und weil Minikube bei jedem von uns lokal läuft, kann jeder das Projekt allein starten und erklären."));
content.push(new Paragraph({ children: [new PageBreak()] }));

// ---- 8. Anhang ----
content.push(h1("8. Anhang"));

content.push(h2("8.1 Eingesetzte Technologien"));
content.push(table(
  ["Komponente", "Variante", "Zweck"],
  [
    ["Debian Linux", "12 (Bookworm)", "Betriebssystem der VM"],
    ["VMware Workstation", "Pro", "Virtualisierung"],
    ["Docker", "Engine", "Container bauen und laufen lassen"],
    ["Minikube", "v1.38", "lokales Kubernetes"],
    ["kubectl", "v1.36", "Kubernetes steuern"],
    ["Nginx", "nginx:alpine", "Frontend, Webserver und Proxy"],
    ["Python Flask", "3.0 auf python:3.12-slim", "Backend mit REST-API"],
    ["PostgreSQL", "postgres:16-alpine", "Datenbank"]
  ],
  [2600, 3360, 3400]
));

content.push(h2("8.2 Wichtige Befehle"));
content.push(code([
  "minikube start --driver=docker --force        # Cluster starten",
  "minikube image build -t m346-frontend ./frontend  # Image bauen",
  "kubectl apply -f k8s/                         # alles deployen",
  "kubectl get pods -n m346                      # Pods prüfen",
  "kubectl get services -n m346                  # Services prüfen",
  "kubectl logs -l app=backend -n m346           # Logs ansehen",
  "kubectl port-forward -n m346 \\               # App erreichbar machen",
  "    svc/frontend-service 8080:80 --address=0.0.0.0",
  "kubectl delete pod -l app=frontend -n m346    # Pod neu starten"
]));

content.push(h2("8.3 Aufbau-Anleitung für jeden Rechner"));
content.push(p("So bringt jeder im Team das Projekt auf seinem eigenen Minikube zum Laufen. Genau das hat unser Lehrer im Feedback verlangt."));
content.push(numbered("Debian VM starten und per SSH einloggen", "setup"));
content.push(numbered("Den Projektordner mit scp auf die VM kopieren", "setup"));
content.push(numbered("minikube start --driver=docker --force ausführen", "setup"));
content.push(numbered("Die beiden Images mit minikube image build bauen", "setup"));
content.push(numbered("kubectl apply -f k8s/ ausführen", "setup"));
content.push(numbered("Mit kubectl get pods warten, bis alle drei auf Running stehen", "setup"));
content.push(numbered("kubectl port-forward starten und die App im Browser öffnen", "setup"));
content.push(spacer());
content.push(p("Damit läuft Minikube bei jedem lokal, und jeder kann die Services zeigen, steuern und erklären."));

// ===================== DOKUMENT =====================
const doc = new Document({
  creator: "Tiziano Ferraro, Albin Hoti, Tim Mostak",
  title: "M346 Dokumentation",
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "2E2E2E" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } }
    ]
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 540, hanging: 280 } } } }] },
      { reference: "steps", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 540, hanging: 280 } } } }] },
      { reference: "flow", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 540, hanging: 280 } } } }] },
      { reference: "setup", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 540, hanging: 280 } } } }] }
    ]
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 6 } },
        children: [new TextRun({ text: "Modul 346 | Containerisierte Web-Anwendung mit Kubernetes | Tiziano, Tim & Albin     Seite ", size: 16, color: "888888" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888" })]
      })] })
    },
    children: content
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("C:\\M346\\doku\\Dokumentation_M346_Tiziano,Tim&Albin.docx", buffer);
  console.log("OK - docx geschrieben");
});
