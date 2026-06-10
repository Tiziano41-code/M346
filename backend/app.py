import os
import psycopg2
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def get_db():
    return psycopg2.connect(
        host=os.environ.get('DB_HOST', 'postgres-service'),
        database=os.environ.get('DB_NAME', 'taskdb'),
        user=os.environ.get('DB_USER', 'taskuser'),
        password=os.environ.get('DB_PASS', 'taskpass')
    )

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            done BOOLEAN DEFAULT FALSE,
            priority VARCHAR(10) DEFAULT 'medium',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cur.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium'")
    cur.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    conn.commit()
    cur.close()
    conn.close()

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

@app.route('/tasks', methods=['GET'])
def get_tasks():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT id, title, done, priority, created_at FROM tasks ORDER BY id DESC')
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([{
        'id': r[0],
        'title': r[1],
        'done': r[2],
        'priority': r[3],
        'created_at': r[4].strftime('%d.%m.%Y %H:%M') if r[4] else ''
    } for r in rows])

@app.route('/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    title = data.get('title', '').strip()
    priority = data.get('priority', 'medium')
    if not title:
        return jsonify({'error': 'title required'}), 400
    if priority not in ('low', 'medium', 'high'):
        priority = 'medium'
    conn = get_db()
    cur = conn.cursor()
    cur.execute('INSERT INTO tasks (title, priority) VALUES (%s, %s) RETURNING id', (title, priority))
    task_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'id': task_id, 'title': title, 'done': False, 'priority': priority}), 201

@app.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.get_json()
    conn = get_db()
    cur = conn.cursor()
    if 'done' in data:
        cur.execute('UPDATE tasks SET done=%s WHERE id=%s', (data['done'], task_id))
    if 'title' in data:
        cur.execute('UPDATE tasks SET title=%s WHERE id=%s', (data['title'], task_id))
    if 'priority' in data:
        cur.execute('UPDATE tasks SET priority=%s WHERE id=%s', (data['priority'], task_id))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'status': 'updated'})

@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute('DELETE FROM tasks WHERE id=%s', (task_id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'status': 'deleted'})

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)
