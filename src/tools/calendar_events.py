import os
import datetime
from typing import Optional
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

# Права доступу, які ми налаштовували в консолі
SCOPES = ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly']
REDIRECT_URI = "http://localhost:8000/api/v1/auth/google/callback"


def get_user_calendar_service(user_tokens_from_db: dict):
    """Створює клієнт Календаря на основе OAuth-токенів користувача."""
    creds = Credentials.from_authorized_user_info(user_tokens_from_db, SCOPES)
    return build('calendar', 'v3', credentials=creds)


async def create_calendar_event(title: str, start_time: str, duration_minutes: int,
                                user_tokens: dict, description: Optional[str] = "") -> str:
    """Створює івент у реальному Google Календарі авторизованого юзера."""
    try:
        service = get_user_calendar_service(user_tokens)

        start_dt = datetime.datetime.strptime(start_time, "%Y-%m-%d %H:%M")
        end_dt = start_dt + datetime.timedelta(minutes=duration_minutes)

        # Налаштовуємо таймзону України (+03:00 для травня)
        timezone_offset = "+03:00"
        start_iso = start_dt.strftime("%Y-%m-%dT%H:%M:%S") + timezone_offset
        end_iso = end_dt.strftime("%Y-%m-%dT%H:%M:%S") + timezone_offset

        event_body = {
            'summary': title,
            'description': description,
            'start': {'dateTime': start_iso, 'timeZone': 'Europe/Kyiv'},
            'end': {'dateTime': end_iso, 'timeZone': 'Europe/Kyiv'},
        }

        # Стукаємося в реальне API Google
        event = service.events().insert(calendarId='primary', body=event_body).execute()
        return f"Успішно! Подію '{title}' створено в реальному Google Календарі. Посилання: {event.get('htmlLink')}"
    except Exception as e:
        return f"Не вдалося створити подію в реальному календарі: {str(e)}"


async def get_calendar_events(date: str, user_tokens: dict) -> str:
    """Витягує події з реального календаря користувача на конкретний день."""
    try:
        service = get_user_calendar_service(user_tokens)

        start_dt = datetime.datetime.strptime(date, "%Y-%m-%d")

        timezone_offset = "+03:00"
        time_min = start_dt.strftime("%Y-%m-%dT00:00:00") + timezone_offset
        time_max = start_dt.strftime("%Y-%m-%dT23:59:59") + timezone_offset

        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime'
        ).execute()

        events = events_result.get('items', [])
        if not events:
            return f"На {date} в календарі користувача немає жодних подій. День повністю вільний."

        result = f"Знайдені події в твоїму реальному календарі на {date}:\n"
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            display_time = start.split('T')[1][:5] if 'T' in start else "Весь день"
            result += f"- [{display_time}] {event['summary']}\n"
        return result
    except Exception as e:
        return f"Не вдалося отримати події з реального календаря: {str(e)}"