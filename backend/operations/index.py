import json
import os
import secrets
from datetime import datetime, timezone

import psycopg2
import psycopg2.extras

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Commander-Token',
    'Access-Control-Max-Age': '86400',
}

CODE_ALPHABET = '0123456789'
MAX_EVENTS_PER_PUSH = 50
MAX_PAYLOAD = 20000


def resp(status: int, body: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'body': json.dumps(body, ensure_ascii=False, default=str),
    }


def conn():
    c = psycopg2.connect(os.environ['DATABASE_URL'])
    c.autocommit = True
    return c


def iso(dt):
    if dt is None:
        return None
    return dt.replace(tzinfo=timezone.utc).isoformat().replace('+00:00', 'Z')


def parse_ts(v):
    try:
        dt = datetime.fromisoformat(str(v).replace('Z', '+00:00'))
        if dt.tzinfo:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt
    except (ValueError, TypeError):
        return datetime.utcnow()


def find_op(cur, code: str):
    cur.execute(
        'SELECT id, code, title, commander_token, is_active, created_at, closed_at FROM operations WHERE code = %s',
        (code,),
    )
    return cur.fetchone()


def op_public(op) -> dict:
    return {
        'code': op['code'],
        'title': op['title'],
        'active': op['is_active'],
        'created_at': iso(op['created_at']),
        'closed_at': iso(op['closed_at']),
    }


def create(cur, body: dict) -> dict:
    title = str(body.get('title') or '').strip()[:200]
    token = secrets.token_hex(24)
    for _ in range(20):
        code = ''.join(secrets.choice(CODE_ALPHABET) for _ in range(4))
        cur.execute('SELECT 1 FROM operations WHERE code = %s AND is_active = TRUE', (code,))
        if cur.fetchone():
            continue
        cur.execute('DELETE FROM operation_events WHERE operation_id IN (SELECT id FROM operations WHERE code = %s)', (code,))
        cur.execute('DELETE FROM operations WHERE code = %s', (code,))
        cur.execute(
            'INSERT INTO operations (code, title, commander_token) VALUES (%s, %s, %s) RETURNING id, code, title, commander_token, is_active, created_at, closed_at',
            (code, title, token),
        )
        op = cur.fetchone()
        return resp(200, {**op_public(op), 'token': token})
    return resp(503, {'error': 'Не удалось выделить код операции, попробуйте ещё раз'})


def push(cur, body: dict, token: str) -> dict:
    op = find_op(cur, str(body.get('code') or ''))
    if not op:
        return resp(404, {'error': 'Операция не найдена'})
    if not token or not secrets.compare_digest(token, op['commander_token']):
        return resp(403, {'error': 'Передавать расчёты может только командир'})
    if not op['is_active']:
        return resp(409, {'error': 'Операция завершена'})

    events = body.get('events') or []
    if not isinstance(events, list):
        return resp(400, {'error': 'events должен быть списком'})

    accepted = []
    for ev in events[:MAX_EVENTS_PER_PUSH]:
        client_id = str(ev.get('client_id') or '')[:64]
        payload = ev.get('payload')
        if not client_id or payload is None:
            continue
        raw = json.dumps(payload, ensure_ascii=False)
        if len(raw) > MAX_PAYLOAD:
            continue
        cur.execute(
            'INSERT INTO operation_events (operation_id, client_id, kind, danger, summary, payload, created_at) '
            'VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s) ON CONFLICT (operation_id, client_id) DO NOTHING',
            (
                op['id'], client_id, str(ev.get('kind') or '')[:32], bool(ev.get('danger')),
                str(ev.get('summary') or '')[:500], raw, parse_ts(ev.get('created_at')),
            ),
        )
        accepted.append(client_id)
    return resp(200, {'accepted': accepted})


def close(cur, body: dict, token: str) -> dict:
    op = find_op(cur, str(body.get('code') or ''))
    if not op:
        return resp(404, {'error': 'Операция не найдена'})
    if not token or not secrets.compare_digest(token, op['commander_token']):
        return resp(403, {'error': 'Завершить операцию может только командир'})
    cur.execute('UPDATE operations SET is_active = FALSE, closed_at = NOW() WHERE id = %s', (op['id'],))
    return resp(200, {'ok': True})


def info(cur, params: dict) -> dict:
    op = find_op(cur, str(params.get('code') or ''))
    if not op:
        return resp(404, {'error': 'Операция с таким кодом не найдена'})
    return resp(200, op_public(op))


def events(cur, params: dict) -> dict:
    op = find_op(cur, str(params.get('code') or ''))
    if not op:
        return resp(404, {'error': 'Операция не найдена'})
    try:
        after = int(params.get('after') or 0)
    except ValueError:
        after = 0
    cur.execute(
        'SELECT id, client_id, kind, danger, summary, payload, created_at, received_at FROM operation_events '
        'WHERE operation_id = %s AND id > %s ORDER BY id LIMIT 200',
        (op['id'], after),
    )
    rows = cur.fetchall()
    return resp(200, {
        **op_public(op),
        'events': [{
            'id': r['id'], 'client_id': r['client_id'], 'kind': r['kind'], 'danger': r['danger'],
            'summary': r['summary'], 'payload': r['payload'],
            'created_at': iso(r['created_at']), 'received_at': iso(r['received_at']),
        } for r in rows],
    })


def handler(event: dict, context) -> dict:
    """Операции горноспасательного отделения: командир создаёт операцию с кодом и передаёт расчёты, база и командный пункт получают их по коду."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = headers.get('x-commander-token', '')
    action = params.get('action', '')

    body = {}
    if method == 'POST':
        try:
            body = json.loads(event.get('body') or '{}')
        except json.JSONDecodeError:
            return resp(400, {'error': 'Некорректный JSON'})
        action = body.get('action') or action

    c = conn()
    try:
        cur = c.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if method == 'POST' and action == 'create':
            return create(cur, body)
        if method == 'POST' and action == 'push':
            return push(cur, body, token)
        if method == 'POST' and action == 'close':
            return close(cur, body, token)
        if method == 'GET' and action == 'info':
            return info(cur, params)
        if method == 'GET' and action == 'events':
            return events(cur, params)
        return resp(400, {'error': 'Неизвестное действие'})
    finally:
        c.close()
