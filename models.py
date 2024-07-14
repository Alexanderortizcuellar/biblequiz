from sqlalchemy import ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy

from datetime import datetime


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)


class User(UserMixin, db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(nullable=False)
    lastname: Mapped[str] = mapped_column(nullable=False)
    username: Mapped[str] = mapped_column(unique=True, nullable=False)
    email: Mapped[str] = mapped_column(unique=True, nullable=False)
    password: Mapped[str] = mapped_column(nullable=False)
    questions: Mapped[list["Question"]] = db.relationship(
        "Question", back_populates="user"
    )  # pyright:ignore


class Question(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[datetime] = mapped_column(default=datetime.now())
    # cateregories: Mapped[str] = mapped_column(default="Bible")
    text: Mapped[str] = mapped_column(nullable=False)
    answer: Mapped[str] = mapped_column(nullable=False)
    options: Mapped[str] = mapped_column(nullable=False)
    quote: Mapped[str] = mapped_column(nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    user: Mapped["User"] = db.relationship(back_populates="questions")  # pyright:ignore


class Bible(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    book: Mapped[int]
    chapter: Mapped[int]
    verse: Mapped[int]
    text: Mapped[str]
