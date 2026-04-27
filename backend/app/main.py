from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routes import companies, articles, article_company_detection, events, scores

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Company Reputation Monitor", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(companies.router)
app.include_router(articles.router)
app.include_router(article_company_detection.router)
app.include_router(events.router)
app.include_router(scores.router)


@app.get("/health")
def health():
    return {"status": "ok"}
