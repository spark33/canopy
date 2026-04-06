.PHONY: install dev test migrate seed frontend backend

install:
	cd backend && pip install -e ".[dev]"
	cd frontend && npm install

dev: backend frontend

backend:
	cd backend && uvicorn app.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

test:
	cd backend && pytest -v
	cd frontend && npm test

migrate:
	cd backend && alembic upgrade head

seed:
	cd backend && python scripts/seed.py
