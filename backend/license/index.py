import json
import os
import hmac
import hashlib
import psycopg2
from datetime import date

CURRENT_VERSION = "1.0.0"
DOWNLOAD_URL = ""


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def compute_signature(key: str, expires_at: str) -> str:
    """Вычисляет HMAC-SHA256 подпись для данных лицензии."""
    secret = os.environ.get('LICENSE_HMAC_SECRET', 'fallback-secret-change-me')
    message = f"{key}:{expires_at}"
    return hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()


def handler(event: dict, context) -> dict:
    """Проверка и активация лицензионного ключа с HMAC подписью."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        action = params.get('action', '')
        if action == 'check-update':
            client_version = params.get('version', '0.0.0')
            has_update = _version_gt(CURRENT_VERSION, client_version)
            return {
                'statusCode': 200,
                'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({
                    'current_version': CURRENT_VERSION,
                    'has_update': has_update,
                    'download_url': DOWNLOAD_URL if has_update else '',
                }),
            }
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Unknown action'})}

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

        signature = compute_signature(row[0], str(expires_at))

        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({
            'valid': True,
            'key': row[0],
            'expires_at': str(expires_at),
            'description': row[2],
            'sig': signature,
        })}

    return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}


def _version_gt(a: str, b: str) -> bool:
    def parts(v):
        return [int(x) for x in v.split('.')]
    return parts(a) > parts(b)
