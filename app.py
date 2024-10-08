from flask import Flask, jsonify, redirect, render_template, request, url_for, flash
from flask_login import (
    LoginManager,
    current_user,
    login_required,
    login_user,
    logout_user,
)
from flask_wtf import FlaskForm
from wtforms import (
    BooleanField,
    PasswordField,
    StringField,
    TextAreaField,
    EmailField,
    ValidationError,
)
from wtforms.validators import DataRequired, EqualTo, Length
from flask_bcrypt import Bcrypt

# from redmail import gmail
import json
import random
from models import db, Bible, User, Question


with open("books.json") as f:
    data = json.load(f)
login_manager = LoginManager()
login_manager.login_view = "login"  # pyright:ignore


app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///project.db"
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.secret_key = "alex"
db.init_app(app)
bcrypt = Bcrypt(app)
login_manager.init_app(app)


class QuizForm(FlaskForm):
    text = TextAreaField("Question", validators=[DataRequired()])
    answer = StringField("Answer", validators=[DataRequired()])
    options = StringField("Options", validators=[DataRequired()])
    quote = StringField("Quote", validators=[DataRequired()])


class LoginForm(FlaskForm):
    username = StringField("Username", validators=[DataRequired()])
    password = PasswordField("Password", validators=[DataRequired()])
    remember = BooleanField("Remember me")


class RegisterForm(FlaskForm):
    name = StringField("Name", validators=[DataRequired()])
    lastname = StringField("Last Name", validators=[DataRequired()])
    email = EmailField("Email", validators=[DataRequired()])
    username = StringField("username", validators=[DataRequired()])
    password = PasswordField(
        "Password",
        validators=[
            DataRequired(),
            Length(min=7, max=21, message="Must be 7 to 21 characters"),
        ],
    )
    password_2 = PasswordField(
        "Password",
        validators=[
            DataRequired(),
            EqualTo("password"),
            Length(min=7, max=21, message="Must be 7 to 21 characters"),
        ],
    )

    def validate_email(self, field):
        user = User.query.filter_by(email=field.data.lower()).first()
        if user is not None:
            raise ValidationError("Email exists")

    def validate_username(self, field):
        user = User.query.filter_by(username=field.data).first()
        if user is not None:
            raise ValidationError("Username exists")


@login_manager.user_loader
def load_user(user_id):
    user = User.query.get(int(user_id))
    return user


with app.app_context():
    db.create_all()


# def send_email(subject: str, to: list[str],
#                template: str,):
#     gmail.username = "alexander2magnus@gmail.com"
#     gmail.password = ""
#     print(subject, to, template)
#     # email = gmail.send()


@app.route("/")
def home():
    number = Question.query.count()
    number_int = number if number > 0 else 1
    random_id = random.randint(1, number_int)
    question = Question.query.filter_by(id=random_id).first()
    count = Question.query.count()
    return render_template("home.html", question=question, count=count)


@app.route("/questions")
def show_questions():
    page = request.args.get("page", 1, type=int)
    questions = Question.query.paginate(per_page=5, page=page)
    return render_template("questions.html", questions=questions)


@app.route("/create", methods=["GET", "POST"])
@login_required
def create():
    form = QuizForm()
    if form.validate_on_submit():
        question = Question(
            text=form.text.data,
            answer=form.answer.data,
            options=form.options.data,
            user_id=current_user.id,
            quote=form.quote.data,
        )  # pyright: ignore
        db.session.add(question)
        db.session.commit()
        flash("New question created")
        return redirect(url_for("details", id=question.id))
    return render_template("form.html", form=form)


@app.route("/details/<int:id>")
def details(id):
    question = db.get_or_404(Question, id)
    return render_template("details.html", question=question)


@app.route("/edit/<int:id>", methods=["POST", "GET"])
@login_required
def edit_question(id):
    question = db.get_or_404(Question, id)
    if request.method == "POST":
        text = request.form.get("text")
        answer = request.form.get("answer")
        options = request.form.get("options")
        quote = request.form.get("quote")
        Question.query.filter_by(id=id).update(
            dict(text=text, answer=answer, options=options, quote=quote)  # pyright:ignore
        )
        db.session.commit()
        flash("Changes successfully applied!")
        return redirect(url_for("details", id=id))
    return render_template("edit.html", question=question)


@app.route("/delete/<int:id>", methods=["POST", "GET"])
@login_required
def delete_question(id):
    if request.method == "POST":
        question = db.get_or_404(Question, id)
        db.session.delete(question)
        db.session.commit()
        flash("Successfully deleted question")
        return redirect(url_for("show_questions"))
    return redirect(url_for("details", id=id))


@app.route("/books", methods=["POST", "GET"])
def get_books():
    return jsonify(data)


@app.route("/bible-picker")
def bible_picker():
    books = list(data["english"].values())
    return render_template("bible-picker.html", books=books)


@app.route("/bible")
@app.route("/bible/<string:quote>")
def bible(quote: str | None = None):
    if quote == "default" or quote is None:
        return redirect(url_for("bible_picker"))
    try:
        book = quote.split(" ")[0]
        names = {
            data["english"][name]["long_name"]: data["english"][name]["index"]
            for name in data["english"].keys()
        }
        if book in names.keys():
            print(f"(*){book}(*)")
            book_index = names[book]
        else:
            book_index = data["english"][book].get("index", 1)
        chapter = int(quote.split(" ")[-1].split(":")[0].strip())
        verse = quote.split(" ")[-1].split(":")[1]
        if "-" in verse:
            verse = verse.split("-")[0]
        print(book, chapter, verse)
        verses = Bible.query.filter_by(book=book_index).filter_by(
                chapter=chapter).all()
        chapter = verses[0].chapter
    except Exception as e:
        print(e)
        flash(f"Error getting quote {quote}")
        return redirect(url_for("bible_picker"))
    return render_template("bible.html", verses=verses, 
                           chapter=chapter, book=book, verse=verse)


@app.route("/login", methods=["GET", "POST"])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data.lower()).first()
        if user and bcrypt.check_password_hash(user.password, form.password.data):
            login_user(user)
            flash("Logged in")
            route = request.args.get("next")
            if route:
                return redirect(route)
            return redirect(url_for("home"))
        else:
            if not user:
                flash(f"Username {form.username.data} does not exist")
            else:
                flash("Invalid credentials")
    return render_template("login.html", form=form)


@app.route("/logout")
def logout():
    logout_user()
    return redirect(url_for("login"))


@app.route("/register", methods=["POST", "GET"])
def register():
    form = RegisterForm()
    if request.method == "POST":
        if form.validate_on_submit():
            new_user = User(
                name=form.name.data.title(),
                lastname=form.lastname.data.title(),
                email=form.email.data.lower(),
                username=form.username.data.lower(),
                password=bcrypt.generate_password_hash(form.password.data).decode(
                    "utf-8"
                ),
            )  # pyright:ignore
            db.session.add(new_user)
            db.session.commit()
            flash("User successfully created")
            return redirect(url_for("login"))
    return render_template("register.html", form=form)
