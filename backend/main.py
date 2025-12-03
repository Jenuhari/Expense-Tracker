from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import categories, expenses
import auth

# Initialize the FastAPI app
app = FastAPI(title="Expense Tracker API")

# CORS – allow React dev server
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to Expense Tracker API"}

# Include routers for categories and expenses
app.include_router(categories.router)
app.include_router(expenses.router)
app.include_router(auth.router)

# Create tables
Base.metadata.create_all(bind=engine)
