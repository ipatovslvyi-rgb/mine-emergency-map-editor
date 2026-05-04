import json
import os
import psycopg2
from datetime import date, datetime


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def check_auth(event: dict) -> bool:
    headers = event.get('headers') or {}
    token = headers.get('X-Admin-Token') or headers.get('x-admin-token') or ''
    return token == os.environ.get('ADMIN_PASSWORD', '')


def handler(event: dict, context) -> dict:
    """Управление лицензионными ключами — только для администратора."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    if not check_auth(event):
        return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'Неверный пароль'})}

    method = event.get('httpMethod', 'GET')
    conn = get_conn()
    cur = conn.cursor()

    if method == 'GET':
        cur.execute("SELECT id, key_code, description, expires_at, created_at, is_active FROM license_keys ORDER BY created_at DESC")
        rows = cur.fetchall()
        conn.close()
        keys = [
            {
                'id': r[0],
                'key': r[1],
                'description': r[2],
                'expires_at': str(r[3]),
                'created_at': r[4].strftime('%d.%m.%Y %H:%M') if r[4] else '',
                'is_active': r[5],
                'expired': r[3] < date.today(),
            }
            for r in rows
        ]
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'keys': keys})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        action = body.get('action', 'create')

        if action == 'create':
            key_code = (body.get('key') or '').strip().upper()
            description = body.get('description', '')
            expires_at = body.get('expires_at', '')

            if not key_code or not expires_at:
                conn.close()
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'key и expires_at обязательны'})}

            cur.execute(
                "INSERT INTO license_keys (key_code, description, expires_at) VALUES (%s, %s, %s) ON CONFLICT (key_code) DO NOTHING RETURNING id",
                (key_code, description, expires_at)
            )
            row = cur.fetchone()
            conn.commit()
            conn.close()
            if not row:
                return {'statusCode': 409, 'headers': cors, 'body': json.dumps({'error': 'Ключ уже существует'})}
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'success': True, 'id': row[0]})}

        if action == 'toggle':
            key_id = body.get('id')
            cur.execute("UPDATE license_keys SET is_active = NOT is_active WHERE id = %s RETURNING is_active", (key_id,))
            row = cur.fetchone()
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'success': True, 'is_active': row[0] if row else None})}

        if action == 'delete':
            key_id = body.get('id')
            cur.execute("DELETE FROM license_keys WHERE id = %s", (key_id,))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'success': True})}

        conn.close()
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Неизвестное действие'})}

    conn.close()
    return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}
