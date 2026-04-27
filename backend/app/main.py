from fastapi import FastAPI
from app.database import Base, engine
from app.routes import companies, articles, events, scores

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Company Reputation Monitor", version="1.0.0")

app.include_router(companies.router)
app.include_router(articles.router)
app.include_router(events.router)
app.include_router(scores.router)


@app.get("/health")
def health():
    return {"status": "ok"}
