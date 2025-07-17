"""
Configuration pytest et fixtures pour les tests AgoraFlux
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db, Base
from app.models.user import User, UserRole
from app.models.project import Project, ProjectStatus, ProjectVisibility
from app.core.security import SecurityUtils
from app.core.config import settings


# Base de données de test en mémoire
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override de la dépendance de base de données pour les tests"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session")
def db_engine():
    """Fixture pour l'engine de base de données de test"""
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(db_engine):
    """Fixture pour une session de base de données de test"""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Fixture pour le client de test FastAPI"""
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session):
    """Fixture pour créer un utilisateur de test"""
    user = User(
        email="test@example.com",
        password_hash=SecurityUtils.get_password_hash("testpassword123"),
        first_name="Test",
        last_name="User",
        role=UserRole.USER,
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_admin(db_session):
    """Fixture pour créer un administrateur de test"""
    admin = User(
        email="admin@example.com",
        password_hash=SecurityUtils.get_password_hash("adminpassword123"),
        first_name="Admin",
        last_name="User",
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture
def test_moderator(db_session):
    """Fixture pour créer un modérateur de test"""
    moderator = User(
        email="moderator@example.com",
        password_hash=SecurityUtils.get_password_hash("modpassword123"),
        first_name="Moderator",
        last_name="User",
        role=UserRole.MODERATOR,
        is_active=True,
        is_verified=True
    )
    db_session.add(moderator)
    db_session.commit()
    db_session.refresh(moderator)
    return moderator


@pytest.fixture
def test_project(db_session, test_user):
    """Fixture pour créer un projet de test"""
    project = Project(
        title="Test Project",
        slug="test-project",
        description="Un projet de test",
        owner_id=test_user.id,
        status=ProjectStatus.ACTIVE,
        visibility=ProjectVisibility.PUBLIC,
        allow_comments=True,
        allow_contributions=True
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)
    return project


@pytest.fixture
def auth_headers(test_user):
    """Fixture pour les headers d'authentification"""
    token = SecurityUtils.create_access_token(
        data={"sub": str(test_user.id), "email": test_user.email, "role": test_user.role.value}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(test_admin):
    """Fixture pour les headers d'authentification admin"""
    token = SecurityUtils.create_access_token(
        data={"sub": str(test_admin.id), "email": test_admin.email, "role": test_admin.role.value}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def moderator_headers(test_moderator):
    """Fixture pour les headers d'authentification modérateur"""
    token = SecurityUtils.create_access_token(
        data={"sub": str(test_moderator.id), "email": test_moderator.email, "role": test_moderator.role.value}
    )
    return {"Authorization": f"Bearer {token}"} 