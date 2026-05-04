import json
import os
import psycopg2
from datetime import date


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    """Проверка и активация лицензионного ключа."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        key_code = (body.get('key') or '').strip().upper()

        if not key_code:
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Ключ не указан'})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT key_code, expires_at, description FROM license_keys WHERE key_code = %s AND is_active = TRUE",
            (key_code,)
        )
        row = cur.fetchone()
        conn.close()

        if not row:
            return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'valid': False, 'error': 'Ключ не найден или деактивирован'})}

        expires_at = row[1]
        if expires_at < date.today():
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'valid': False, 'error': 'Срок действия ключа истёк', 'expires_at': str(expires_at)})}

        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({
            'valid': True,
            'key': row[0],
            'expires_at': str(expires_at),
            'description': row[2],
        })}

    return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}
